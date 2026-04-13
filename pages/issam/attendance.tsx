import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Badge, Select } from "@roketid/windmill-react-ui";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  ScanLine,
  Keyboard,
  CalendarDays,
  UserCheck,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";

import Layout from "../containers/Layout";
import PageTitle from "../components/Typography/PageTitle";
import api from "../../lib/api";

type ScanState =
  | "idle"
  | "starting"
  | "scanning"
  | "processing"
  | "success"
  | "error";

type AttendanceScanResponse = {
  success: boolean;
  message: string;
  data?: {
    status?: string;
    attendanceId?: number;
    attendanceDate?: string;
    markedAt?: string;
    attendee?: {
      attendeeId?: number;
      name?: string;
      uniqueId?: string;
      phone?: string;
      gender?: string;
      passportUrl?: string;
    };
    pass?: {
      passId?: number;
      serialNumber?: string;
      token?: string;
    };
  };
};

type AttendanceSummaryResponse = {
  success: boolean;
  message: string;
  data?: {
    eventId?: number;
    attendanceDate?: string;
    registeredCount?: number;
    presentCount?: number;
    absentCount?: number;
    attendanceLock?: {
      enabled?: boolean;
      isClosed?: boolean;
      closeTime?: string | null;
      closeDateTime?: string | null;
      message?: string | null;
    };
  };
};

type AttendanceRecord = {
  attendanceId: number;
  attendanceDate?: string;
  markedAt?: string;
  attendee?: {
    attendeeId?: number;
    firstName?: string;
    lastName?: string;
    name?: string;
    uniqueId?: string;
    phone?: string;
    gender?: string;
    passportUrl?: string;
  };
  pass?: {
    passId?: number;
    serialNumber?: string;
    token?: string;
  };
  marker?: {
    name?: string;
  };
};

type AttendanceListResponse = {
  success: boolean;
  message: string;
  data?: {
    data?: AttendanceRecord[];
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
};

type ScanResultModalData = {
  type: "success" | "error";
  title: string;
  message: string;
  attendanceDate?: string;
  markedAt?: string;
  scannedCode?: string;
  attendeeName?: string;
  uniqueId?: string;
  phone?: string;
};

type ResultModalProps = {
  open: boolean;
  data: ScanResultModalData | null;
  onClose: () => void;
};

const SCANNER_REGION_ID = "attendance-scanner-region";
const EVENT_ID = 1;
const DEFAULT_PER_PAGE = 10;

function ResultModal({ open, data, onClose }: ResultModalProps) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-6 pb-4 text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                data.type === "success"
                  ? "bg-emerald-100 dark:bg-emerald-900/20"
                  : "bg-red-100 dark:bg-red-900/20"
              }`}
            >
              {data.type === "success" ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              )}
            </div>

            <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {data.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {data.message}
            </p>

            <div className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 text-left space-y-2">
              {data.attendeeName ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Attendee:
                  </span>{" "}
                  {data.attendeeName}
                </p>
              ) : null}

              {data.uniqueId ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Unique ID:
                  </span>{" "}
                  {data.uniqueId}
                </p>
              ) : null}

              {data.phone ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Phone:
                  </span>{" "}
                  {data.phone}
                </p>
              ) : null}

              {data.attendanceDate ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Attendance Date:
                  </span>{" "}
                  {formatDisplayDate(data.attendanceDate)}
                </p>
              ) : null}

              {data.markedAt ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Marked At:
                  </span>{" "}
                  {formatDisplayDateTime(data.markedAt)}
                </p>
              ) : null}

              {data.scannedCode ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Pass Code:
                  </span>{" "}
                  {maskToken(data.scannedCode)}
                </p>
              ) : null}
            </div>

            <Button
              className={`mt-6 w-full rounded-2xl h-12 ${
                data.type === "success"
                  ? "bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800"
                  : "bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700"
              }`}
              onClick={onClose}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function maskToken(value: string) {
  if (!value) return "—";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatDisplayDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDisplayDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAttendeeName(record: AttendanceRecord) {
  return (
    record.attendee?.name ||
    `${record.attendee?.fullName || ""} `.trim() ||
    "Unknown attendee"
  );
}

function PassportAvatar({
  name,
  passportUrl,
  size = "md",
}: {
  name: string;
  passportUrl?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-10 w-10 rounded-xl"
      : size === "lg"
        ? "h-16 w-16 rounded-2xl"
        : "h-12 w-12 rounded-2xl";

  return passportUrl ? (
    <img
      src={passportUrl}
      alt={name}
      className={`${sizeClass} object-cover border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shrink-0`}
    />
  ) : (
    <div
      className={`${sizeClass} flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-400 shrink-0`}
    >
      <Users className="w-5 h-5" />
    </div>
  );
}

export default function AttendanceScannerPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [deviceName, setDeviceName] = useState("Main Attendance Scanner");
  const [manualToken, setManualToken] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(getTodayDateValue());

  const [summary, setSummary] = useState({
    registeredCount: 0,
    presentCount: 0,
    absentCount: 0,
  });

  const [attendanceLock, setAttendanceLock] = useState({
    enabled: false,
    isClosed: false,
    closeTime: "",
    closeDateTime: "",
    message: "",
  });

  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalData, setResultModalData] =
    useState<ScanResultModalData | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    void loadSummary();
    void loadAttendanceRecords(1);

    return () => {
      isMountedRef.current = false;
      void stopScanner();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    void loadSummary();
    void loadAttendanceRecords(1);
  }, [attendanceDate]);

  useEffect(() => {
    if (attendanceLock.isClosed && isScannerRunning) {
      void stopScanner();
    }
  }, [attendanceLock.isClosed, isScannerRunning]);

  async function loadCameras() {
    try {
      const devices = await Html5Qrcode.getCameras();

      const mapped = devices.map((device) => ({
        id: device.id,
        label: device.label || `Camera ${device.id.slice(0, 6)}`,
      }));

      if (!isMountedRef.current) return [];

      setAvailableCameras(mapped);

      if (!selectedCameraId && mapped.length > 0) {
        const rearCamera =
          mapped.find((cam) => {
            const label = cam.label.toLowerCase();
            return (
              label.includes("back") ||
              label.includes("rear") ||
              label.includes("environment")
            );
          }) || mapped[0];

        setSelectedCameraId(rearCamera.id);
      }

      return mapped;
    } catch {
      if (!isMountedRef.current) return [];
      toast.error("Unable to access available cameras.");
      return [];
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current && isScannerRunning) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } else if (scannerRef.current) {
        await scannerRef.current.clear();
      }
    } catch {
      //
    } finally {
      if (!isMountedRef.current) return;
      setIsScannerRunning(false);
      setScanState("idle");
    }
  }

  async function startScanner() {
    if (attendanceLock.isClosed) {
      setResultModalData({
        type: "error",
        title: "Attendance Closed",
        message:
          attendanceLock.message ||
          "Attendance taking has been closed for today.",
      });
      setResultModalOpen(true);
      return;
    }

    if (scanState === "starting" || scanState === "processing") return;

    try {
      setScanState("starting");

      const devices = availableCameras.length
        ? availableCameras
        : await loadCameras();

      if (!devices || devices.length === 0) {
        setScanState("error");
        setHasCameraPermission(false);
        setResultModalData({
          type: "error",
          title: "No camera found",
          message: "No usable camera was detected on this device.",
        });
        setResultModalOpen(true);
        return;
      }

      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch {
          //
        }
      }

      const scanner = new Html5Qrcode(SCANNER_REGION_ID);
      scannerRef.current = scanner;

      const isMobile =
        typeof navigator !== "undefined" &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      const cameraConfig: string | { facingMode: "environment" } =
        selectedCameraId
          ? selectedCameraId
          : isMobile
            ? { facingMode: "environment" }
            : devices[0].id;

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.333334,
        },
        async (decodedText) => {
          const now = Date.now();

          if (
            decodedText === lastScannedRef.current &&
            now - lastScanTimeRef.current < 2500
          ) {
            return;
          }

          lastScannedRef.current = decodedText;
          lastScanTimeRef.current = now;

          await markAttendance(decodedText);
        },
        () => {
          //
        },
      );

      if (!isMountedRef.current) return;

      setHasCameraPermission(true);
      setIsScannerRunning(true);
      setScanState("scanning");
      toast.success("Scanner started");
    } catch (error: any) {
      if (!isMountedRef.current) return;

      setHasCameraPermission(false);
      setIsScannerRunning(false);
      setScanState("error");
      setResultModalData({
        type: "error",
        title: "Scanner failed to start",
        message:
          error?.message ||
          "Camera permission was denied or the scanner could not initialize.",
      });
      setResultModalOpen(true);
      toast.error("Unable to start scanner.");
    }
  }

  async function loadSummary() {
    try {
      const { data } = await api.get<AttendanceSummaryResponse>(
        `/events/${EVENT_ID}/attendance/summary`,
        {
          params: { date: attendanceDate },
        },
      );

      setSummary({
        registeredCount: data?.data?.registeredCount || 0,
        presentCount: data?.data?.presentCount || 0,
        absentCount: data?.data?.absentCount || 0,
      });

      setAttendanceLock({
        enabled: !!data?.data?.attendanceLock?.enabled,
        isClosed: !!data?.data?.attendanceLock?.isClosed,
        closeTime: data?.data?.attendanceLock?.closeTime || "",
        closeDateTime: data?.data?.attendanceLock?.closeDateTime || "",
        message: data?.data?.attendanceLock?.message || "",
      });
    } catch {
      //
    }
  }

  async function loadAttendanceRecords(page = 1) {
    try {
      setLoadingRecords(true);

      const { data } = await api.get<AttendanceListResponse>(
        `/events/${EVENT_ID}/attendance`,
        {
          params: {
            date: attendanceDate,
            page,
            per_page: perPage,
          },
        },
      );

      const payload = data?.data;

      setAttendanceRecords(payload?.data || []);
      setCurrentPage(payload?.current_page || page);
      setLastPage(payload?.last_page || 1);
      setTotalRecords(payload?.total || 0);
      setPerPage(payload?.per_page || DEFAULT_PER_PAGE);
    } catch {
      toast.error("Unable to load attendance records.");
    } finally {
      setLoadingRecords(false);
    }
  }

  async function markAttendance(rawToken: string) {
    const token = rawToken.trim();
    if (!token) return;

    if (attendanceLock.isClosed) {
      setScanState("error");
      setResultModalData({
        type: "error",
        title: "Attendance Closed",
        message:
          attendanceLock.message ||
          "Attendance taking has been closed for today.",
        attendanceDate,
        scannedCode: token,
      });
      setResultModalOpen(true);
      return;
    }

    try {
      setScanState("processing");

      const { data } = await api.post<AttendanceScanResponse>(
        `/events/${EVENT_ID}/attendance/scan`,
        {
          token,
          deviceName,
          scanSource: "barcode",
          attendanceDate,
        },
      );

      const resultData = data?.data || {};

      setResultModalData({
        type: "success",
        title: "Attendance Marked",
        message: data?.message || "Attendance marked successfully.",
        attendanceDate: resultData.attendanceDate,
        markedAt: resultData.markedAt,
        scannedCode: token,
        attendeeName: resultData.attendee?.fullName,
        uniqueId: resultData.attendee?.uniqueId,
        phone: resultData.attendee?.phone,
      });

      setManualToken("");
      setScanState("success");
      setResultModalOpen(true);

      await loadSummary();
      await loadAttendanceRecords(currentPage);

      toast.success(data?.message || "Attendance marked successfully.");
    } catch (error: any) {
      const response = error?.response?.data;
      const resultData = response?.data || {};
      const isClosed = resultData?.status === "attendance_closed";

      if (isClosed) {
        setAttendanceLock((prev) => ({
          ...prev,
          enabled: true,
          isClosed: true,
          closeTime: resultData?.closeTime || prev.closeTime,
          closeDateTime: resultData?.closeDateTime || prev.closeDateTime,
          message:
            response?.message || "Attendance taking has been closed for today.",
        }));

        if (isScannerRunning) {
          await stopScanner();
        }
      }

      setResultModalData({
        type: "error",
        title: isClosed ? "Attendance Closed" : "Attendance Not Marked",
        message: response?.message || "Attendance could not be marked.",
        attendanceDate: resultData.attendanceDate,
        markedAt: resultData.markedAt,
        scannedCode: token,
        attendeeName: resultData.attendee?.name,
        uniqueId: resultData.attendee?.uniqueId,
        phone: resultData.attendee?.phone,
      });

      setScanState("error");
      setResultModalOpen(true);
      toast.error(response?.message || "Attendance could not be marked.");
    }
  }

  function handleCloseResultModal() {
    setResultModalOpen(false);
    setResultModalData(null);
    setScanState(isScannerRunning ? "scanning" : "idle");
  }

  async function submitManualToken(e: React.FormEvent) {
    e.preventDefault();

    if (attendanceLock.isClosed) {
      toast.error(
        attendanceLock.message ||
          "Attendance taking has been closed for today.",
      );
      return;
    }

    if (!manualToken.trim()) {
      toast.error("Enter a pass code first.");
      return;
    }

    await markAttendance(manualToken);
  }

  const statusBadge = useMemo(() => {
    if (scanState === "scanning") return { type: "success", label: "Scanning" };
    if (scanState === "processing")
      return { type: "warning", label: "Processing" };
    if (scanState === "success") return { type: "success", label: "Marked" };
    if (scanState === "error") return { type: "danger", label: "Attention" };
    if (scanState === "starting") return { type: "warning", label: "Starting" };
    return { type: "neutral", label: "Idle" };
  }, [scanState]);

  const paginationMetaText =
    totalRecords > 0
      ? `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(
          currentPage * perPage,
          totalRecords,
        )} of ${totalRecords} records`
      : "No records";

  return (
    <Layout>
      <ResultModal
        open={resultModalOpen}
        data={resultModalData}
        onClose={handleCloseResultModal}
      />

      <div className="mb-6">
        <PageTitle>Attendance Scanner</PageTitle>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Scan attendee passes each morning and mark attendance automatically
          for the selected date.
        </p>

        <div className="mt-4 rounded-3xl overflow-hidden bg-gradient-to-r from-green-900 via-green-800 to-green-700 shadow-xl">
          <div className="px-4 py-5 sm:px-8 sm:py-8 text-white">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wide uppercase">
                Daily Attendance
              </div>

              <h2 className="mt-3 text-xl sm:text-3xl font-bold leading-tight">
                One scan, one attendance record per day
              </h2>

              <p className="mt-2 text-xs sm:text-base text-slate-200 leading-6">
                Supervisors can scan each attendee pass once daily. Tap OK after
                each result to continue scanning.
              </p>
            </div>
          </div>
        </div>
      </div>

      {attendanceLock.enabled ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 ${
            attendanceLock.isClosed
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300"
          }`}
        >
          <p className="text-sm font-semibold">
            {attendanceLock.isClosed ? "Attendance Closed" : "Attendance Open"}
          </p>
          <p className="mt-1 text-sm">
            {attendanceLock.message ||
              (attendanceLock.closeTime
                ? `Attendance closes at ${attendanceLock.closeTime}.`
                : "Attendance timing is active.")}
          </p>
        </div>
      ) : null}

      <div className="sm:hidden space-y-4">
        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Attendance Date
            </label>
            <Input
              readOnly
              type="date"
              className="h-11 rounded-2xl border-gray-200 dark:border-gray-600"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {!isScannerRunning ? (
              <Button
                onClick={startScanner}
                disabled={
                  attendanceLock.isClosed ||
                  scanState === "starting" ||
                  scanState === "processing"
                }
                className="rounded-2xl h-12 bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800 w-full"
              >
                <span className="inline-flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {attendanceLock.isClosed
                    ? "Attendance Closed"
                    : "Start Scanner"}
                </span>
              </Button>
            ) : (
              <Button
                layout="outline"
                onClick={stopScanner}
                className="rounded-2xl h-12 w-full"
              >
                <span className="inline-flex items-center gap-2">
                  <CameraOff className="w-4 h-4" />
                  Stop Scanner
                </span>
              </Button>
            )}

            <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-2">
              <div
                id={SCANNER_REGION_ID}
                className="overflow-hidden rounded-2xl min-h-[320px] bg-black"
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Today&apos;s Register
            </h4>
            <Button
              layout="outline"
              className="rounded-2xl h-10"
              onClick={() => loadAttendanceRecords(currentPage)}
            >
              Refresh
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {loadingRecords ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading attendance...
              </p>
            ) : attendanceRecords.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No attendance records yet.
              </p>
            ) : (
              attendanceRecords.map((record) => {
                const attendeeName = getAttendeeName(record);

                return (
                  <div
                    key={record.attendanceId}
                    className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <PassportAvatar
                        name={attendeeName}
                        passportUrl={record.attendee?.photoUrl}
                        size="lg"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white break-words">
                          {attendeeName}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 break-all">
                          {record.attendee?.uniqueId || "—"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDisplayDateTime(record.markedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              layout="outline"
              className="rounded-2xl h-10 px-4"
              disabled={currentPage <= 1 || loadingRecords}
              onClick={() => loadAttendanceRecords(currentPage - 1)}
            >
              <span className="inline-flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                Prev
              </span>
            </Button>

            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Page {currentPage} of {lastPage}
            </span>

            <Button
              layout="outline"
              className="rounded-2xl h-10 px-4"
              disabled={currentPage >= lastPage || loadingRecords}
              onClick={() => loadAttendanceRecords(currentPage + 1)}
            >
              <span className="inline-flex items-center gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </span>
            </Button>
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
            {paginationMetaText}
          </p>
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Scanner
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Point the camera at the printed attendee pass.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isScannerRunning ? (
                <Button
                  onClick={startScanner}
                  disabled={
                    attendanceLock.isClosed ||
                    scanState === "starting" ||
                    scanState === "processing"
                  }
                  className="rounded-2xl h-11 bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800 w-full sm:w-auto"
                >
                  <span className="inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {attendanceLock.isClosed
                      ? "Attendance Closed"
                      : "Start Scanner"}
                  </span>
                </Button>
              ) : (
                <Button
                  layout="outline"
                  onClick={stopScanner}
                  className="rounded-2xl h-11 w-full sm:w-auto"
                >
                  <span className="inline-flex items-center gap-2">
                    <CameraOff className="w-4 h-4" />
                    Stop Scanner
                  </span>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr,250px]">
            <div>
              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-2 sm:p-3">
                <div
                  id={SCANNER_REGION_ID}
                  className="overflow-hidden rounded-2xl min-h-[300px] sm:min-h-[360px] md:min-h-[420px] bg-black"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scanner Name
                </label>
                <Input
                  className="h-11 rounded-2xl border-gray-200 dark:border-gray-600"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Main Hall Scanner"
                />
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Attendance Date
                </label>
                <Input
                  readOnly
                  type="date"
                  className="h-11 rounded-2xl border-gray-200 dark:border-gray-600"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Camera
                </label>
                <Select
                  className="h-11 rounded-2xl border-gray-200 dark:border-gray-600"
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  disabled={isScannerRunning}
                >
                  {availableCameras.length === 0 ? (
                    <option value="">No camera loaded yet</option>
                  ) : (
                    availableCameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label}
                      </option>
                    ))
                  )}
                </Select>

                <div className="mt-3">
                  <Button
                    layout="outline"
                    className="rounded-2xl w-full h-10"
                    onClick={loadCameras}
                    disabled={isScannerRunning}
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4" />
                      Refresh Cameras
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Attendance Guide
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-3">
                <CalendarDays className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                <p>Attendance is marked once per attendee per selected day.</p>
              </div>

              <div className="flex gap-3">
                <UserCheck className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                <p>
                  If a pass is scanned again on the same day, the backend should
                  return already marked.
                </p>
              </div>

              <div className="flex gap-3">
                <ScanLine className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                <p>
                  Use manual entry only when the printed QR or barcode is
                  damaged or unreadable.
                </p>
              </div>

              <div className="flex gap-3">
                <Users className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                <p>
                  After every scan, tap OK on the popup to continue scanning.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Attendance Register
                </h3>
              </div>

              <Button
                layout="outline"
                className="rounded-2xl h-10"
                onClick={() => loadAttendanceRecords(currentPage)}
              >
                Refresh
              </Button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Passport
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Attendee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Unique ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Time Marked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {loadingRecords ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400"
                        >
                          Loading attendance records...
                        </td>
                      </tr>
                    ) : attendanceRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400"
                        >
                          No attendance records found for this date.
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((record) => {
                        const attendeeName = getAttendeeName(record);

                        return (
                          <tr key={record.attendanceId}>
                            <td className="px-4 py-3">
                              <PassportAvatar
                                name={attendeeName}
                                passportUrl={record.attendee?.photoUrl}
                                size="md"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {attendeeName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {record.attendee?.uniqueId || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {formatDisplayDateTime(record.markedAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {paginationMetaText}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  layout="outline"
                  className="rounded-2xl h-10 px-4"
                  disabled={currentPage <= 1 || loadingRecords}
                  onClick={() => loadAttendanceRecords(currentPage - 1)}
                >
                  <span className="inline-flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </span>
                </Button>

                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {lastPage}
                </span>

                <Button
                  layout="outline"
                  className="rounded-2xl h-10 px-4"
                  disabled={currentPage >= lastPage || loadingRecords}
                  onClick={() => loadAttendanceRecords(currentPage + 1)}
                >
                  <span className="inline-flex items-center gap-2">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current Device
              </p>
              <p className="mt-2 font-semibold text-gray-900 dark:text-white break-words">
                {deviceName || "Unnamed scanner"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
