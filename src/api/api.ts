import axios from "axios";
import { createDPoPProof } from "../crypto/dpop";
import { API_BASE_URL } from "../config";
import { storage } from "../utils/storage";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

api.interceptors.request.use(async (config) => {
    const token = storage.getToken();
    const fullUrl = `${config.baseURL}${config.url}`;
    const method = config.method?.toUpperCase() || "GET";
    const proof = await createDPoPProof(fullUrl, method);

    console.log("🔐 DPoP Proof Target:", fullUrl);
    console.log("🔐 Method:", method);
    console.log("🔐 Token Prefix:", token?.substring(0, 20));

    config.headers["Authorization"] = `Bearer ${token}`;
    config.headers["x-bev-signature"] = proof;

    console.log(proof)
    config.withCredentials = true;
    return config;
});


export default api;
