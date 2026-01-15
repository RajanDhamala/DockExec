
import rateLimit from 'express-rate-limit';

const endpoints = {
  // General / low-risk endpoints
  normal: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 req / 15 min
  getMetrics: { limit: 20, windowMs: 10 * 60 * 1000 }, // 20 req / 10 min

  // Critical / CPU-heavy endpoints
  programmizExec: { limit: 20, windowMs: 10 * 60 * 1000 }, // 20 req / 10 min
  reRunRecentExe: { limit: 20, windowMs: 10 * 60 * 1000 },
  reRunTestPrint: { limit: 20, windowMs: 10 * 60 * 1000 },
  allTestCases: { limit: 15, windowMs: 10 * 60 * 1000 },
  testPrint: { limit: 15, windowMs: 10 * 60 * 1000 },
  saveDraft: { limit: 30, windowMs: 10 * 60 * 1000 },
  feedback: { limit: 4, windowMs: 10 * 60 * 1000 },
  changeProfile: { limit: 5, windowMs: 10 * 60 * 1000 },

  // Security-sensitive endpoints
  changePassword: { limit: 3, windowMs: 60 * 60 * 1000 },  // 3 / 1 hour
  setNotification: { limit: 7, windowMs: 30 * 60 * 1000 },  // 7 / 30 min
  logout: { limit: 5, windowMs: 20 * 60 * 1000 },  // 5 / 20 min

  // User interaction / light endpoints
  changeCoordinates: { limit: 5, windowMs: 20 * 60 * 1000 },  // 5 / 20 min
  tokenGraph: { limit: 30, windowMs: 10 * 60 * 1000 }   // 30 / 10 min
};

const createLimiter = (route) => {
  const { limit, windowMs } = endpoints[route] || endpoints.normal;

  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
};


export default createLimiter


