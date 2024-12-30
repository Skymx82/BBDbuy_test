const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');

const clientId = 'AQZB7nCdzF6z7Feq3eq5iDf2QO0pnyvcu-Fyj-r_qAuGFpUhTRfWDwfiywHCrX1UkErDA9kaxr0HoDzq';
const clientSecret = 'EHny0U5tD-2VdP71k3sVPtELuw3fSPajpMOqu5Swk6n42wHhCriK5bdASPvu3lRLbhJ5GoUl7oQV4MRJ';
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

const app = express();
app.use(cors({
    origin: ['https://bbdbuy.netlify.app', 'http://localhost:8081'], // Autoriser votre domaine frontend
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.post('/create-payment', async (req, res) => {
    const { total } = req.body;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
            {
                amount: {
                    currency_code: 'USD',
                    value: total.toString(),
                },
            },
        ],
        application_context: {
            return_url: `${baseUrl}/success`,
            cancel_url: `${baseUrl}/cancel`,
        },
    });

    try {
        const order = await client.execute(request);
        const approvalLink = order.result.links.find(link => link.rel === 'approve');
        if (approvalLink) {
            res.json({ approval_url: approvalLink.href });
        } else {
            res.status(500).send("Lien d'approbation non trouvé.");
        }
    } catch (error) {
        console.error("Erreur PayPal:", error);
        res.status(500).send("Erreur lors de la création de la commande.");
    }
});

app.get('/success', async (req, res) => {
    const { token } = req.query;
    const request = new paypal.orders.OrdersCaptureRequest(token);

    try {
        await client.execute(request);
        res.redirect('https://bbdbuy.netlify.app/success');
    } catch (error) {
        console.error("Erreur de capture PayPal:", error);
        res.redirect('https://bbdbuy.netlify.app/failure');
    }
});

app.get('/cancel', (req, res) => {
    res.redirect('https://bbdbuy.netlify.app/failure');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur backend lancé sur http://localhost:${PORT}`));
