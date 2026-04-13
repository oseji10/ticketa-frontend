"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../containers/Layout";
import PageTitle from "../components/Typography/PageTitle";
import { Button, Input, Badge, Select } from "@roketid/windmill-react-ui";
import {
  Camera,
  CameraOff,
  RefreshCcw,
  Users,
  Search,
  QrCode,
  MapPinHouse,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import api from "../../lib/api";

const EVENT_ID = 1;
const SCANNER_REGION_ID = "room-checkin-scanner-region";
const ITEMS_PER_PAGE = 10;

const HOTELS = [
  { key: "royal_choice_inn", label: "Royal Choice Inn" },
  { key: "conference_center_hall", label: "Conference Center Hall" },
];

type ScanState =
  | "idle"
  | "starting"
  | "scanning"
  | "processing"
  | "success"
  | "error";

type AttendeeRow = {
  attendeeId: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  uniqueId?: string;
  phone?: string;
  gender?: string;
  passportUrl?: string | null;
  accommodation?: string | null;
  color?: string | null;
  currentRoomAllocation?: {
    allocationId?: number;
    hotel?: string | null;
    roomNumber?: string | null;
    checkedInAt?: string | null;
    reason?: string | null;
    status?: string | null;
  } | null;
};

type RegisteredAttendeesResponse = {
  success: boolean;
  message: string;
  data?: AttendeeRow[] | { data?: AttendeeRow[] };
  attendees?: AttendeeRow[];
};

type ScanLookupResponse = {
  success: boolean;
  message: string;
  data?: {
    attendee?: AttendeeRow;
    alreadyCheckedIn?: boolean;
    currentAllocation?: {
      allocationId?: number;
      hotel?: string | null;
      roomNumber?: string | null;
      checkedInAt?: string | null;
      status?: string | null;
    } | null;
  };
};

type ActionResponse = {
  success: boolean;
  message: string;
  data?: any;
};

type ResultModalData = {
  type: "success" | "error";
  title: string;
  message: string;
};

type ResultModalProps = {
  open: boolean;
  data: ResultModalData | null;
  onClose: () => void;
};

type AssignmentModalProps = {
  open: boolean;
  attendee: AttendeeRow | null;
  hotel: string;
  roomNumber: string;
  submitting: boolean;
  onHotelChange: (value: string) => void;
  onRoomNumberChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

function ResultModal({ open, data, onClose }: ResultModalProps) {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-6 pb-5 text-center">
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

function AssignmentModal({
  open,
  attendee,
  hotel,
  roomNumber,
  submitting,
  onHotelChange,
  onRoomNumberChange,
  onSubmit,
  onClose,
}: AssignmentModalProps) {
  if (!open || !attendee) return null;

  return (
    <div className="fixed inset-0 z-[85]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shrink-0">
                {attendee.passportUrl ? (
                  <img
                    src={attendee.passportUrl}
                    alt={getAttendeeName(attendee)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <Users className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white break-words">
                  Assign Room
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 break-words">
                  {getAttendeeName(attendee)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 break-all mt-1">
                  {attendee.uniqueId || "No unique ID"}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Hotel
              </label>
              <Select
                className="h-12 rounded-2xl border-gray-200 dark:border-gray-600"
                value={hotel}
                onChange={(e) => onHotelChange(e.target.value)}
              >
                <option value="">Select hotel</option>
                {HOTELS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Number
              </label>
              <Input
                className="h-12 rounded-2xl border-gray-200 dark:border-gray-600"
                placeholder="Enter room number"
                value={roomNumber}
                onChange={(e) => onRoomNumberChange(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                onClick={onSubmit}
                className="rounded-2xl h-12 bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800"
                disabled={submitting}
              >
                {submitting ? "Assigning..." : "Assign Room"}
              </Button>

              <Button
                layout="outline"
                onClick={onClose}
                className="rounded-2xl h-12"
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAttendeeName(attendee: AttendeeRow) {
  return (
    attendee.fullName ||
    attendee.name ||
    `${attendee.firstName || ""} ${attendee.lastName || ""}`.trim() ||
    "Unnamed attendee"
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function getHotelLabel(value?: string | null) {
  if (!value) return "—";
  return HOTELS.find((h) => h.key === value)?.label || value;
}

export default function RegisteredAttendeesRoomPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const lastScannedRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const [scannerSubmitting, setScannerSubmitting] = useState(false);
  const [scannerAttendee, setScannerAttendee] = useState<AttendeeRow | null>(
    null,
  );
  const [scannerHotel, setScannerHotel] = useState("");
  const [scannerRoomNumber, setScannerRoomNumber] = useState("");

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalData, setResultModalData] =
    useState<ResultModalData | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchRegisteredAttendees();

    return () => {
      isMountedRef.current = false;
      void stopScanner();
    };
  }, []);

  async function fetchRegisteredAttendees() {
    try {
      setLoading(true);

      const { data } = await api.get<RegisteredAttendeesResponse>(
        `/events/${EVENT_ID}/registered-attendees2`,
      );

      const rows =
        (data?.data as any)?.data ||
        (Array.isArray(data?.data) ? data?.data : undefined) ||
        data?.attendees ||
        [];

      const normalizedRows = Array.isArray(rows) ? rows : [];
      setAttendees(normalizedRows);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to load registered attendees.",
      );
    } finally {
      setLoading(false);
    }
  }

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
    if (
      scanState === "starting" ||
      scanState === "processing" ||
      assignmentModalOpen
    ) {
      return;
    }

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

          await lookupAttendee(decodedText);
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

  async function lookupAttendee(rawQrValue: string) {
    const qrValue = rawQrValue.trim();
    if (!qrValue || assignmentModalOpen || scannerSubmitting) return;

    try {
      setScanState("processing");

      const { data } = await api.post<ScanLookupResponse>(
        `/events/${EVENT_ID}/room-checkins/scan-lookup`,
        { qrValue },
      );

      const attendee = data?.data?.attendee || null;
      const alreadyCheckedIn = !!data?.data?.alreadyCheckedIn;
      const currentAllocation = data?.data?.currentAllocation || null;

      if (!attendee) {
        setScanState("error");
        setResultModalData({
          type: "error",
          title: "Attendee Not Found",
          message: data?.message || "No attendee was found for this QR code.",
        });
        setResultModalOpen(true);
        return;
      }

      if (alreadyCheckedIn) {
        setScanState("error");
        setResultModalData({
          type: "error",
          title: "Already Checked In",
          message: `${getAttendeeName(attendee)} is already assigned to ${getHotelLabel(
            currentAllocation?.hotel,
          )}, room ${currentAllocation?.roomNumber || "—"}.`,
        });
        setResultModalOpen(true);
        return;
      }

      setScannerAttendee(attendee);
      setScannerHotel("");
      setScannerRoomNumber("");
      setAssignmentModalOpen(true);
      setScanState("success");
      toast.success("Attendee found");
    } catch (error: any) {
      setScanState("error");
      setResultModalData({
        type: "error",
        title: "Lookup Failed",
        message:
          error?.response?.data?.message || "Unable to fetch attendee from QR.",
      });
      setResultModalOpen(true);
      toast.error(
        error?.response?.data?.message || "Unable to fetch attendee from QR.",
      );
    }
  }

  async function handleRoomCheckin() {
    if (!scannerAttendee) {
      toast.error("No attendee loaded.");
      return;
    }

    if (!scannerHotel) {
      toast.error("Please select a hotel.");
      return;
    }

    if (!scannerRoomNumber.trim()) {
      toast.error("Please enter a room number.");
      return;
    }

    try {
      setScannerSubmitting(true);
      setScanState("processing");

      const { data } = await api.post<ActionResponse>(
        `/events/${EVENT_ID}/room-checkins/checkin`,
        {
          attendeeId: scannerAttendee.attendeeId,
          hotel: scannerHotel,
          roomNumber: scannerRoomNumber.trim(),
        },
      );

      setAssignmentModalOpen(false);
      setResultModalData({
        type: "success",
        title: "Check-In Successful",
        message: data?.message || "Attendee checked in successfully.",
      });
      setResultModalOpen(true);

      toast.success(data?.message || "Checked in successfully.");

      setScannerAttendee(null);
      setScannerHotel("");
      setScannerRoomNumber("");
      setScanState(isScannerRunning ? "scanning" : "idle");

      await fetchRegisteredAttendees();
      setCurrentPage(1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Unable to complete room check-in.";

      setAssignmentModalOpen(false);
      setResultModalData({
        type: "error",
        title: "Check-In Failed",
        message,
      });
      setResultModalOpen(true);

      setScanState("error");
      toast.error(message);
    } finally {
      setScannerSubmitting(false);
    }
  }

  function handleCloseResultModal() {
    setResultModalOpen(false);
    setResultModalData(null);
    setScanState(isScannerRunning ? "scanning" : "idle");
  }

  function handleCloseAssignmentModal() {
    setAssignmentModalOpen(false);
    setScannerAttendee(null);
    setScannerHotel("");
    setScannerRoomNumber("");
    setScanState(isScannerRunning ? "scanning" : "idle");
  }

  const checkedInCount = attendees.filter(
    (item) => item.currentRoomAllocation,
  ).length;
  const pendingCount = attendees.filter(
    (item) => !item.currentRoomAllocation,
  ).length;

  const scannedAttendees = useMemo(() => {
    return attendees.filter((attendee) => attendee.currentRoomAllocation);
  }, [attendees]);

  const filteredScannedAttendees = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return scannedAttendees;

    return scannedAttendees.filter((attendee) => {
      const name = getAttendeeName(attendee).toLowerCase();
      const uniqueId = (attendee.uniqueId || "").toLowerCase();
      const phone = (attendee.phone || "").toLowerCase();
      const hotel = (
        attendee.currentRoomAllocation?.hotel ||
        attendee.accommodation ||
        ""
      ).toLowerCase();
      const room = (
        attendee.currentRoomAllocation?.roomNumber || ""
      ).toLowerCase();

      return (
        name.includes(value) ||
        uniqueId.includes(value) ||
        phone.includes(value) ||
        hotel.includes(value) ||
        room.includes(value)
      );
    });
  }, [search, scannedAttendees]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredScannedAttendees.length / ITEMS_PER_PAGE),
  );

  const paginatedScannedAttendees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredScannedAttendees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredScannedAttendees, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const statusBadge = useMemo(() => {
    if (scanState === "scanning") return { type: "success", label: "Scanning" };
    if (scanState === "processing")
      return { type: "warning", label: "Processing" };
    if (scanState === "success") return { type: "success", label: "Ready" };
    if (scanState === "error") return { type: "danger", label: "Attention" };
    if (scanState === "starting") return { type: "warning", label: "Starting" };
    return { type: "neutral", label: "Idle" };
  }, [scanState]);

  return (
    <Layout>
      <ResultModal
        open={resultModalOpen}
        data={resultModalData}
        onClose={handleCloseResultModal}
      />

      <AssignmentModal
        open={assignmentModalOpen}
        attendee={scannerAttendee}
        hotel={scannerHotel}
        roomNumber={scannerRoomNumber}
        submitting={scannerSubmitting}
        onHotelChange={setScannerHotel}
        onRoomNumberChange={setScannerRoomNumber}
        onSubmit={handleRoomCheckin}
        onClose={handleCloseAssignmentModal}
      />

      <div className="mb-6">
        <PageTitle>Room Check-In Management</PageTitle>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Scan attendee QR code, assign room in the popup, and continue
          scanning.
        </p>

        <div className="mt-4 rounded-3xl overflow-hidden bg-gradient-to-r from-green-900 via-green-800 to-green-700 shadow-xl">
          <div className="px-4 py-5 sm:px-8 sm:py-8 text-white">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-wide uppercase">
                Supervisor Room Desk
              </div>

              <h2 className="mt-3 text-xl sm:text-3xl font-bold leading-tight">
                Scan QR and assign rooms fast
              </h2>

              <p className="mt-2 text-xs sm:text-base text-slate-200 leading-6">
                Mobile is now simplified for faster room desk operations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 hidden md:grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Scanner Status
          </p>
          <div className="mt-3">
            <Badge type={statusBadge.type as any}>{statusBadge.label}</Badge>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Checked In</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {checkedInCount}
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Camera Access
          </p>
          <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
            {hasCameraPermission === null
              ? "Not requested yet"
              : hasCameraPermission
                ? "Allowed"
                : "Blocked or unavailable"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr,0.75fr]">
        <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Live Scanner
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                On mobile, only the scanner flow is shown for speed.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isScannerRunning ? (
                <Button
                  onClick={startScanner}
                  disabled={
                    scanState === "starting" ||
                    scanState === "processing" ||
                    assignmentModalOpen
                  }
                  className="rounded-2xl h-11 bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800 w-full sm:w-auto"
                >
                  <span className="inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Start Scanner
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

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr,260px]">
            <div>
              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-2 sm:p-3">
                <div
                  id={SCANNER_REGION_ID}
                  className="overflow-hidden rounded-2xl min-h-[320px] sm:min-h-[380px] md:min-h-[440px] bg-black"
                />
              </div>
            </div>

            <div className="hidden lg:block space-y-4">
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

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Scanner Tips
                  </h4>
                </div>

                <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>Use the back camera for clearer scanning.</li>
                  <li>Keep the QR inside the frame.</li>
                  <li>Room selection appears after a successful scan.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden xl:block space-y-5">
          <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-5">
            <div className="flex items-center gap-2">
              <MapPinHouse className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Quick Summary
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Scanned / Checked In
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {checkedInCount}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Awaiting Assignment
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {pendingCount}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current Status
                </p>
                <div className="mt-2">
                  <Badge type={statusBadge.type as any}>
                    {statusBadge.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scanned Attendees
            </h3>
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <Input
              className="pl-10 h-11 rounded-2xl border-gray-200 dark:border-gray-600"
              placeholder="Search name, phone, ID, hotel, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
              Loading attendees...
            </div>
          ) : filteredScannedAttendees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-sm text-gray-500 dark:text-gray-400">
              No scanned attendees found.
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-[1000px] w-full">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 pr-4">Attendee</th>
                      <th className="py-3 pr-4">Unique ID</th>
                      <th className="py-3 pr-4">Phone</th>
                      <th className="py-3 pr-4">Gender</th>
                      <th className="py-3 pr-4">Hotel</th>
                      <th className="py-3 pr-4">Room Number</th>
                      <th className="py-3 pr-4">Checked In At</th>
                      <th className="py-3 pr-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedScannedAttendees.map((attendee) => {
                      const current = attendee.currentRoomAllocation;

                      return (
                        <tr
                          key={attendee.attendeeId}
                          className="border-b border-gray-100 dark:border-gray-700 align-top"
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-start gap-3">
                              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shrink-0">
                                {attendee.passportUrl ? (
                                  <img
                                    src={attendee.passportUrl}
                                    alt={getAttendeeName(attendee)}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <Users className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {getAttendeeName(attendee)}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  ID: {attendee.attendeeId}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                            {attendee.uniqueId || "—"}
                          </td>

                          <td className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                            {attendee.phone || "—"}
                          </td>

                          <td className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {attendee.gender || "—"}
                          </td>

                          <td className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                            {attendee?.accommodation ||
                              getHotelLabel(current?.hotel)}
                          </td>

                          <td className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                            {current?.roomNumber || "—"}
                          </td>

                          <td className="py-4 pr-4 text-sm text-gray-700 dark:text-gray-300">
                            {formatDateTime(current?.checkedInAt)}
                          </td>

                          <td className="py-4 pr-4">
                            <Badge type="success">Checked In</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {paginatedScannedAttendees.map((attendee) => {
                  const current = attendee.currentRoomAllocation;

                  return (
                    <div
                      key={attendee.attendeeId}
                      className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shrink-0">
                          {attendee.passportUrl ? (
                            <img
                              src={attendee.passportUrl}
                              alt={getAttendeeName(attendee)}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <Users className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white break-words">
                            {getAttendeeName(attendee)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                            {attendee.uniqueId || "—"}
                          </p>
                          <div className="mt-2">
                            <Badge type="success">Checked In</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Phone
                          </p>
                          <p className="mt-1 text-gray-900 dark:text-white break-words">
                            {attendee.phone || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Gender
                          </p>
                          <p className="mt-1 text-gray-900 dark:text-white capitalize">
                            {attendee.gender || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Hotel
                          </p>
                          <p className="mt-1 text-gray-900 dark:text-white break-words">
                            {attendee?.accommodation ||
                              getHotelLabel(current?.hotel)}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            Room
                          </p>
                          <p className="mt-1 text-gray-900 dark:text-white">
                            {current?.roomNumber || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <p className="text-gray-500 dark:text-gray-400">
                          Checked In At
                        </p>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {formatDateTime(current?.checkedInAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing{" "}
                  <span className="font-semibold">
                    {filteredScannedAttendees.length === 0
                      ? 0
                      : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredScannedAttendees.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">
                    {filteredScannedAttendees.length}
                  </span>{" "}
                  scanned attendees
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    layout="outline"
                    className="rounded-2xl h-10 px-4"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </span>
                  </Button>

                  <div className="px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </div>

                  <Button
                    layout="outline"
                    className="rounded-2xl h-10 px-4"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
