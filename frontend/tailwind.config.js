import daisyui from "daisyui";
import mantine from "@mantine/core";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            animation: {
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
        },
    },
    plugins: [daisyui, mantine],

    daisyui: {
        themes: ["light", "dark"],
    },
};
