const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk'); // SDK PayPal Commerce Platform

// Configurez votre client PayPal
const clientId = 'AbVATpiMoWmpilf5PysGiBVJ3hIlCBU06sBdT5Qta3bvXIH32vRFSBX5y9BISTBJKd9XlT9OE4RK44Jb';
const clientSecret = 'EBpARSk8phoDl94Mua75G360yzIQQasS0xzO4HOpvymq4JDISG7gJBPnWFL-9w3D3mZbgNgLfnnjqIoU';
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret); // Utilisez ProductionEnvironment pour la production
const client = new paypal.core.PayPalHttpClient(environment);

const app = express();
app.use(cors());
app.use(express.json());

// Route pour créer un paiement
app.post('/create-payment', async (req, res) => {
    const { total } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
        intent: 'CAPTURE', // Pour capturer immédiatement le paiement
        purchase_units: [{
            amount: {
                currency_code: 'USD',
                value: total.toString(),
            },
        }],
        application_context: {
            return_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        },
    });

    try {
        const order = await client.execute(request);
        res.json({ approval_url: order.links.find(link => link.rel === 'approve').href });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
});

// Gestion des redirections
app.get('/success', async (req, res) => {
    const { token } = req.query;
    const request = new paypal.orders.OrdersCaptureRequest(token);

    try {
        const capture = await client.execute(request);
        res.redirect('http://localhost:8081/success'); // URL de succès
    } catch (error) {
        console.error(error);
        res.redirect('http://localhost:8081/failure'); // URL d'échec
    }
});

app.get('/cancel', (req, res) => {
    res.redirect('http://localhost:8081/failure'); // URL d'échec
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Serveur backend lancé sur http://localhost:${PORT}`));
