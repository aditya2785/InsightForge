"use client";

import { useCallback, useEffect, useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import type { BusinessRow } from "@/lib/types";

type DatasetType = "sales" | "inventory" | "customers";

export default function UploadPage() {
  const router = useRouter();
  const [datasetType, setDatasetType] =
    useState<DatasetType>("sales");
  const [data, setData] = useState<BusinessRow[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [salesUploaded, setSalesUploaded] = useState(false);
  const [inventoryUploaded, setInventoryUploaded] = useState(false);
  const [customersUploaded, setCustomersUploaded] = useState(false);

  const markDatasetUploaded = useCallback((type: DatasetType) => {
    if (type === "sales") setSalesUploaded(true);
    if (type === "inventory") setInventoryUploaded(true);
    if (type === "customers") setCustomersUploaded(true);
  }, []);

  const loadDataFromAurora = useCallback(async (type: DatasetType) => {
    try {
      const response = await fetch("/api/upload");

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const uploads = await response.json();

      if (!Array.isArray(uploads)) {
        setData([]);
        return;
      }

      const latestUpload = uploads.find(
        (item: { datasetType?: unknown; data?: unknown }) =>
          item.datasetType === type
      );

      if (latestUpload) {
        setData(
          Array.isArray(latestUpload.data)
            ? latestUpload.data
            : []
        );
        markDatasetUploaded(type);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error(error);
      setData([]);
    }
  }, [markDatasetUploaded]);

  useEffect(() => {
    queueMicrotask(() => {
      loadDataFromAurora("sales");
    });
  }, [loadDataFromAurora]);

  const handleDatasetChange = async (type: DatasetType) => {
    setDatasetType(type);
    setUploadMessage("");
    await loadDataFromAurora(type);
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadMessage("Uploading dataset...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<BusinessRow>) => {
        const parsedData = results.data;

        setData(parsedData);
        markDatasetUploaded(datasetType);

        localStorage.setItem(
          `${datasetType}_data`,
          JSON.stringify(parsedData)
        );

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              datasetType,
              rows: parsedData,
            }),
          });

          const result = await response.json();

          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }

          setUploadMessage(
            response.ok && result.success
              ? "Dataset uploaded to Aurora successfully."
              : result.error ?? "Upload failed."
          );
        } catch (error) {
          console.error(error);
          setUploadMessage("Upload failed. Please try again.");
        }
      },
      error: () => {
        setUploadMessage("Could not parse the CSV file.");
      },
    });
  };

  const currentStatus =
    datasetType === "sales"
      ? salesUploaded
      : datasetType === "inventory"
      ? inventoryUploaded
      : customersUploaded;

  const showNextButton = data.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Upload Business Data
        </h1>

        {showNextButton && (
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold transition"
          >
            Dashboard -&gt;
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleDatasetChange("sales")}
          className={`px-4 py-2 rounded-lg ${
            datasetType === "sales"
              ? "bg-blue-600"
              : "bg-slate-800"
          }`}
        >
          Sales Data
        </button>

        <button
          onClick={() => handleDatasetChange("inventory")}
          className={`px-4 py-2 rounded-lg ${
            datasetType === "inventory"
              ? "bg-blue-600"
              : "bg-slate-800"
          }`}
        >
          Inventory Data
        </button>

        <button
          onClick={() => handleDatasetChange("customers")}
          className={`px-4 py-2 rounded-lg ${
            datasetType === "customers"
              ? "bg-blue-600"
              : "bg-slate-800"
          }`}
        >
          Customer Data
        </button>
      </div>

      <div className="bg-slate-900 p-6 rounded-xl mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          {datasetType.charAt(0).toUpperCase() +
            datasetType.slice(1)}{" "}
          Dataset Overview
        </h2>

        <div className="space-y-2 text-slate-300">
          <p>
            Status: {currentStatus ? "Uploaded" : "Not Uploaded"}
          </p>
          <p>Rows: {data.length}</p>
          <p>
            Columns:{" "}
            {data.length > 0 ? Object.keys(data[0]).length : 0}
          </p>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-xl mb-8">
        <h3 className="text-xl font-semibold mb-4">
          Upload{" "}
          {datasetType.charAt(0).toUpperCase() +
            datasetType.slice(1)}{" "}
          CSV
        </h3>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="block"
        />

        {uploadMessage && (
          <p className="mt-4 text-slate-300">
            {uploadMessage}
          </p>
        )}
      </div>

      {data.length > 0 && (
        <div className="bg-slate-900 rounded-xl p-6 overflow-auto">
          <h2 className="text-2xl font-semibold mb-4">
            Data Preview
          </h2>

          <table className="w-full border-collapse">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th
                    key={key}
                    className="border border-slate-700 p-2 text-left"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.slice(0, 5).map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, i) => (
                    <td
                      key={i}
                      className="border border-slate-700 p-2"
                    >
                      {String(value ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
