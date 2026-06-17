-- CreateTable
CREATE TABLE "BusinessHealthScore" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "revenueScore" INTEGER NOT NULL,
    "inventoryScore" INTEGER NOT NULL,
    "customerScore" INTEGER NOT NULL,
    "forecastScore" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessHealthScore_userId_idx" ON "BusinessHealthScore"("userId");

-- CreateIndex
CREATE INDEX "BusinessHealthScore_userId_createdAt_idx" ON "BusinessHealthScore"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BusinessHealthScore" ADD CONSTRAINT "BusinessHealthScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
