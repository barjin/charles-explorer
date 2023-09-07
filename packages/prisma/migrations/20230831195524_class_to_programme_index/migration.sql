-- CreateTable
CREATE TABLE "ClassToProgramme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ClassToProgramme_B_idx" ON "ClassToProgramme"("B");

-- CreateIndex
CREATE INDEX "ClassToProgramme_A_idx" ON "ClassToProgramme"("A");

-- CreateIndex
CREATE UNIQUE INDEX "ClassToProgramme_A_B_key" ON "ClassToProgramme"("A", "B");
