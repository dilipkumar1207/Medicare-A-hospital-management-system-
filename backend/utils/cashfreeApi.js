import "dotenv/config";

const CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;

const BASE_URL =
    process.env.CASHFREE_ENV === "PRODUCTION"
        ? "https://api.cashfree.com"
        : "https://sandbox.cashfree.com";

const API_VERSION = "2025-01-01";

const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "x-client-id": CLIENT_ID,
    "x-client-secret": CLIENT_SECRET,
    "x-api-version": API_VERSION,
};

export const createCashfreeOrder = async (orderRequest) => {
    const response = await fetch(
        `${BASE_URL}/pg/orders`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(orderRequest),
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    if (!response.ok) {
        const error = new Error(
            data?.message ||
            `Cashfree API failed with status ${response.status}`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
};


export const getCashfreePayments = async (orderId) => {
    const response = await fetch(
        `${BASE_URL}/pg/orders/${encodeURIComponent(orderId)}/payments`,
        {
            method: "GET",
            headers,
        }
    );

    const text = await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }

    if (!response.ok) {
        const error = new Error(
            data?.message ||
            `Cashfree API failed with status ${response.status}`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
};