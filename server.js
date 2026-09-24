const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const reservationTo = process.env.RESERVATION_TO || "jari@op.pl";

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

function field(value, max) {
  return String(value || "").trim().slice(0, max);
}

function reservationText({ name, phone, guests, datetime, notes }) {
  return [
    "Rezerwacja stolika — Restauracja Świerczów",
    "Imię i nazwisko: " + name,
    "Telefon: " + phone,
    "Liczba osób: " + guests,
    "Termin: " + datetime,
    notes ? "Uwagi: " + notes : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function mailtoLink(subject, body) {
  return (
    "mailto:" +
    reservationTo +
    "?subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(body)
  );
}

function canSendMail() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendReservation(subject, body) {
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: reservationTo,
    replyTo: process.env.SMTP_USER,
    subject,
    text: body,
  });
}

app.post("/rezerwacja", async (req, res) => {
  const name = field(req.body && req.body.name, 120);
  const phone = field(req.body && req.body.phone, 40);
  const guests = field(req.body && req.body.guests, 3);
  const datetime = field(req.body && req.body.datetime, 40);
  const notes = field(req.body && req.body.notes, 1000);
  const guestsNumber = Number(guests);

  if (!name || !phone || !guests || !datetime) {
    res.status(400).json({
      ok: false,
      message: "Uzupełnij imię, telefon, liczbę osób i datę.",
    });
    return;
  }

  if (!Number.isInteger(guestsNumber) || guestsNumber < 1 || guestsNumber > 80) {
    res.status(400).json({
      ok: false,
      message: "Liczba osób musi być od 1 do 80.",
    });
    return;
  }

  const subject = "Rezerwacja stolika — " + name;
  const body = reservationText({ name, phone, guests, datetime, notes });

  if (canSendMail()) {
    try {
      await sendReservation(subject, body);
      res.json({
        ok: true,
        sent: true,
        message: "Prośba o stolik została wysłana. Rezerwacje potwierdzamy telefonicznie.",
      });
      return;
    } catch (error) {
      console.error("Nie udało się wysłać maila z rezerwacją:", error.message);
    }
  }

  res.json({
    ok: true,
    sent: false,
    mailto: mailtoLink(subject, body),
    message: "Otworzyliśmy wiadomość e-mail. Możesz też zadzwonić — rezerwacje przyjmujemy telefonicznie.",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log("Restauracja Świerczów nasłuchuje na porcie " + port);
});
