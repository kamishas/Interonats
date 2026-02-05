import fetch from 'node-fetch';

const AUTH_URL = 'https://9tesg7rn8j.execute-api.us-east-2.amazonaws.com/prod/login';

console.log(`Testing connectivity to: ${AUTH_URL}`);

try {
    const response = await fetch(AUTH_URL, {
        method: 'OPTIONS', // Check preflight/availability
    });

    console.log(`Response Status: ${response.status}`);
    console.log('Headers:', response.headers.raw());

    if (response.ok || response.status === 405 || response.status === 403) {
        console.log("Endpoint is reachable.");
    } else {
        console.log("Endpoint might be down or blocked.");
    }

} catch (error) {
    console.error("Connection failed:", error.message);
}
