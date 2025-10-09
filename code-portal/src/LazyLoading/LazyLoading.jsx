
import { lazy } from "react";

export const LazyLandingPage = lazy(() => import("../Pages/LandingPage.jsx"));
export const LazyLoginPage = lazy(() => import("../Auth/LoginPage.jsx"));
export const LazyRegisterPage = lazy(() => import("../Auth/Registerpage.jsx"));
export const LazyTestPage = lazy(() => import("../Pages/Testpage.jsx"));

