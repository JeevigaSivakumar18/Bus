import axios from "axios";

// Replace with your computer's IP
const API = axios.create({
  baseURL: "http://192.168.137.1:5000/api",
});

export default API;