import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import teachersRouter from "./teachers";
import circlesRouter from "./circles";
import studentsRouter from "./students";
import attendanceRouter from "./attendance";
import recitationsRouter from "./recitations";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(teachersRouter);
router.use(circlesRouter);
router.use(studentsRouter);
router.use(attendanceRouter);
router.use(recitationsRouter);
router.use(reportsRouter);

export default router;
