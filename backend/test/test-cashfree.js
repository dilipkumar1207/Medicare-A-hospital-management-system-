import "dotenv/config";

const clientId = process.env.CASHFREE_CLIENT_ID;
const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
const environment = process.env.CASHFREE_ENV;

const baseUrl =
    environment === "PRODUCTION"
        ? "https://api.cashfree.com"
        : "https://sandbox.cashfree.com";

console.log("======================================");
console.log("CASHFREE DIRECT API TEST");
console.log("======================================");
console.log("Environment:", environment);
console.log("Client ID exists:", !!clientId);
console.log("Secret exists:", !!clientSecret);
console.log("URL:", `${baseUrl}/pg/orders`);

const orderRequest = {
    order_amount: 10.00,
    order_currency: "INR",
    order_id: `test_${Date.now()}`,

    customer_details: {
        customer_id: "test_user_123",
        customer_phone: "9876543210",
    },

    order_meta: {
        return_url:
            "http://localhost:5173/payment-success?order_id={order_id}",
    },
};

console.log("Order request:", orderRequest);

try {
    const response = await fetch(
        `${baseUrl}/pg/orders`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "x-client-id": clientId,
                "x-client-secret": clientSecret,
                "x-api-version": "2025-01-01",
            },

            body: JSON.stringify(orderRequest),
        }
    );

    const responseText = await response.text();

    console.log("");
    console.log("======================================");
    console.log("CASHFREE RESPONSE");
    console.log("======================================");
    console.log("HTTP STATUS:", response.status);
    console.log("RESPONSE:", responseText);
    console.log("======================================");

} catch (error) {

    console.log("");
    console.log("======================================");
    console.log("NETWORK ERROR");
    console.log("======================================");
    console.error(error);
}