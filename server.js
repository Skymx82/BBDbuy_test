const express = require('express');
const cors = require('cors');
const paypal = require('paypal-rest-sdk');

paypal.configure({
  mode: 'sandbox',
  client_id: 'AbVATpiMoWmpilf5PysGiBVJ3hIlCBU06sBdT5Qta3bvXIH32vRFSBX5y9BISTBJKd9XlT9OE4RK44Jb',
  client_secret: 'EBpARSk8phoDl94Mua75G360yzIQQasS0xzO4HOpvymq4JDISG7gJBPnWFL-9w3D3mZbgNgLfnnjqIoU',
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-payment', async (req, res) => {
    const { total } = req.body;
  
    const create_payment_json = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      transactions: [
        {
          amount: { currency: 'USD', total: total.toString() },
          description: 'Paiement via BBDBuy',
        },
      ],
      redirect_urls: {
        return_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
      },
    };
  
    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error(error);
        res.status(500).send(error);
      } else {
        res.json({ approval_url: payment.links[1].href });
      }
    });
  });
  
  // Gestion des redirections
  app.get('/success', (req, res) => {
    const { paymentId, PayerID } = req.query;
  
    paypal.payment.execute(paymentId, { payer_id: PayerID }, (error, payment) => {
      if (error) {
        console.error(error);
        return res.redirect('http://localhost:8081/failure'); // URL pour la WebView échec
      }
  
      console.log('Paiement réussi :', payment);
      res.redirect('http://localhost:8081/success'); // URL pour la WebView succès
    });
});
  
app.get('/cancel', (req, res) => {
    res.redirect('http://localhost:8081/failure'); // URL pour la WebView échec
});
  

const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur backend lancé sur http://localhost:${PORT}`));
