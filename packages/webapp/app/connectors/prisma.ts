import dotenv from "dotenv";
import { findUpSync } from "find-up";

dotenv.config({ path: findUpSync('.env', { cwd: __dirname }) });

import { db as Prisma } from "@charles-explorer/prisma";

export const db = Prisma;