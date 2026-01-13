
import { lazy } from "react";

export const LazyLandingPage = lazy(() => import("../Pages/LandingPage.jsx"));
export const LazyLoginPage = lazy(() => import("../Auth/LoginPage.jsx"));
export const LazyRegisterPage = lazy(() => import("../Auth/Registerpage.jsx"));
export const LazyTestPage = lazy(() => import("../Pages/Testpage.jsx"));
export const LazyWritePage = lazy(() => import("../Pages/WriteCode.jsx"))
export const LazyLeetCode = lazy(() => import("../Pages/LeetCode.jsx"))
export const LazySettingsPage = lazy(() => import("../Pages/SettingsPage.jsx"))
export const LazyBillingPage = lazy(() => import("../Pages/BillingPage.jsx"))
export const LazyPrefrencePage = lazy(() => import("../Pages/PrefrencePage.jsx"))
export const LazyPasswordReset = lazy(() => import("../Pages/PasswordReset.jsx"))


