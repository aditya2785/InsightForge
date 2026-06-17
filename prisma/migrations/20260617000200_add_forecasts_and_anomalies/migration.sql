-- CreateTable
CREATE TABLE "Forecast" (
    "id" TEXT NOT NULL,
    "forecastType" TEXT NOT NULL,
    "predictionDate" TIMESTAMP(3) NOT NULL,
    "predictedValue" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "datasetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Forecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL,
    "anomalyType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "datasetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Forecast_userId_idx" ON "Forecast"("userId");

-- CreateIndex
CREATE INDEX "Forecast_forecastType_idx" ON "Forecast"("forecastType");

-- CreateIndex
CREATE INDEX "Forecast_predictionDate_idx" ON "Forecast"("predictionDate");

-- CreateIndex
CREATE INDEX "Forecast_userId_forecastType_predictionDate_idx" ON "Forecast"("userId", "forecastType", "predictionDate");

-- CreateIndex
CREATE INDEX "Anomaly_userId_idx" ON "Anomaly"("userId");

-- CreateIndex
CREATE INDEX "Anomaly_anomalyType_idx" ON "Anomaly"("anomalyType");

-- CreateIndex
CREATE INDEX "Anomaly_severity_idx" ON "Anomaly"("severity");

-- CreateIndex
CREATE INDEX "Anomaly_userId_anomalyType_severity_idx" ON "Anomaly"("userId", "anomalyType", "severity");

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forecast" ADD CONSTRAINT "Forecast_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "UploadedData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anomaly" ADD CONSTRAINT "Anomaly_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "UploadedData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
