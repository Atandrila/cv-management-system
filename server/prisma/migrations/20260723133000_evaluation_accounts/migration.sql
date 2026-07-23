ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "isEvaluationAccount" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_isEvaluationAccount_idx" ON "User"("isEvaluationAccount");
