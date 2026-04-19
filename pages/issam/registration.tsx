import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Input,
  Button,
  Badge,
  Select,
  Pagination,
} from "@roketid/windmill-react-ui";
import {
  Search,
  UserRound,
  Phone,
  Hash,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  CalendarDays,
  BadgeCheck,
  Loader2,
  MapPin,
  Landmark,
  Image as ImageIcon,
  X,
  Home,
  Users,
  Palette,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import Layout from "../containers/Layout";
import PageTitle from "../components/Typography/PageTitle";
import api from "../../lib/api";

type AssignedPassData = {
  passId: number;
  serialNumber: string;
  status: string;
  assignedAt: string | null;
} | null;

type ColorData = {
  colorId: number;
  name: string;
  hexCode?: string | null;
  capacity: number;
} | null;

type SubCLData = {
  subClId: number;
  userId: number;
  name?: string;
  email?: string;
  phone?: string;
} | null;

type AttendeeData = {
  attendeeId: number;
  eventId: number;
  uniqueId: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  organization: string | null;
  gender: string | null;
  category: string | null;
  age: number | null;
  state: string | null;
  lga: string | null;
  ward: string | null;
  community: string | null;
  religion: string | null;
  bank: string | null;
  accountName: string | null;
  accountNumber: string | null;
  photoUrl: string | null;
  isRegistered: boolean;
  registeredAt: string | null;
  registeredBy: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  assignedPass: AssignedPassData;
  color?: ColorData;
  subCL?: SubCLData;
};

type SearchResponseData = {
  attendee: Omit<AttendeeData, "assignedPass">;
  assignedPass: AssignedPassData;
};

type RegisteredAttendeeRow = {
  attendeeId: number;
  fullName: string;
  uniqueId: string | null;
  phone: string | null;
  gender: string | null;
  accommodation: string | null;
  color: string | null; // This is colorName from backend
  colorHex: string | null; // This is hexCode from backend
  subcl: string | null; // This is SubCL full name from backend
  serialNumber: string | null;
  registeredAt: string | null;
};

type RegisteredAttendeesResponse = {
  attendees: RegisteredAttendeeRow[];
};

type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

function formatDisplayDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString().toUpperCase();
}

function toDisplayUpper(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).toUpperCase();
}

function normalizeGender(value?: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function getSuggestedAccommodation(gender?: string | null) {
  const g = normalizeGender(gender);
  if (g === "MALE") return "ROYAL CHOICE INN";
  if (g === "FEMALE") return "CONFERENCE CENTER HALL";
  return "";
}

function AppStatusPill({
  label,
  tone = "neutral",
  color,
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "primary" | "neutral";
  color?: string;
}) {
  if (color) {
    return (
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border shadow-sm"
        style={{
          backgroundColor: `${color}20`,
          borderColor: color,
          color: color,
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
    );
  }

  return <Badge type={tone as any}>{label}</Badge>;
}

function InfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-100 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/30 dark:to-gray-800/50 p-4 transition-all duration-300 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600">
      <div className="flex items-start gap-3">
        <div
          className={`rounded-xl ${
            color ? "bg-white/90" : "bg-white dark:bg-gray-800"
          } p-2.5 border border-gray-100 dark:border-gray-700 shrink-0 transition-transform duration-300 group-hover:scale-110`}
          style={color ? { borderColor: color, color: color } : {}}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
            {label}
          </p>
          <p
            className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white break-words uppercase leading-tight"
            style={color ? { color: color } : {}}
          >
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ColorBadge({
  colorName,
  hexCode,
}: {
  colorName?: string | null;
  hexCode?: string | null;
}) {
  if (!colorName) return <span className="text-gray-400">—</span>;

  const displayColor = hexCode || "#6B7280";

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
        style={{ backgroundColor: displayColor }}
      />
      <span className="font-semibold uppercase">{colorName}</span>
    </div>
  );
}

function RegisteredAttendeeMobileCard({
  item,
}: {
  item: RegisteredAttendeeRow;
}) {
  return (
    <div className="group rounded-2xl border border-gray-100 dark:border-gray-700 p-5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-gray-900 dark:text-white uppercase break-words">
            {toDisplayUpper(item.fullName)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 uppercase">
            {toDisplayUpper(item.uniqueId)}
          </p>
        </div>
        <div className="shrink-0">
          <AppStatusPill label="REGISTERED" tone="success" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <InfoCard
          icon={<Phone className="w-4 h-4" />}
          label="PHONE"
          value={toDisplayUpper(item.phone)}
        />
        <InfoCard
          icon={<UserRound className="w-4 h-4" />}
          label="GENDER"
          value={toDisplayUpper(item.gender)}
        />
        <InfoCard
          icon={<Home className="w-4 h-4" />}
          label="ACCOMMODATION"
          value={toDisplayUpper(item.accommodation)}
        />
        {item.color && (
          <InfoCard
            icon={<Palette className="w-4 h-4" />}
            label="ASSIGNED COLOR"
            value={toDisplayUpper(item.color)}
            color={item.colorHex || undefined}
          />
        )}
        {item.subcl && (
          <InfoCard
            icon={<Users className="w-4 h-4" />}
            label="SUB COMMUNITY LEADER"
            value={toDisplayUpper(item.subcl)}
          />
        )}
        <InfoCard
          icon={<Hash className="w-4 h-4" />}
          label="SERIAL"
          value={toDisplayUpper(item.serialNumber)}
        />
        <InfoCard
          icon={<CalendarDays className="w-4 h-4" />}
          label="REGISTERED AT"
          value={formatDisplayDateTime(item.registeredAt)}
        />
      </div>
    </div>
  );
}

function RegistrationModal({
  isOpen,
  attendee,
  serialNumber,
  setSerialNumber,
  accommodation,
  setAccommodation,
  registering,
  canRegister,
  onClose,
  onRegister,
  serialInputRef,
}: {
  isOpen: boolean;
  attendee: AttendeeData | null;
  serialNumber: string;
  setSerialNumber: (value: string) => void;
  accommodation: string;
  setAccommodation: (value: string) => void;
  registering: boolean;
  canRegister: boolean;
  onClose: () => void;
  onRegister: () => void;
  serialInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  if (!isOpen || !attendee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div className="w-full h-[95dvh] sm:h-auto sm:max-h-[92vh] sm:max-w-7xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col animate-slideUp">
        {/* Header */}
        <div className="px-5 sm:px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wide mb-2">
                <BadgeCheck className="w-3.5 h-3.5" />
                Registration
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white uppercase">
                Attendee Registration
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Confirm details, enter QR serial, and complete registration
              </p>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900/30 dark:to-gray-800/30">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
            {/* Left Column - Attendee Details */}
            <div className="space-y-5">
              {/* Photo & Main Info */}
              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
                  <div className="relative h-36 w-36 sm:h-44 sm:w-44 overflow-hidden rounded-3xl border-4 border-white dark:border-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center shrink-0 shadow-lg">
                    {attendee.photoUrl ? (
                      <img
                        src={attendee.photoUrl}
                        alt={attendee.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 w-full text-center md:text-left">
                    <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                      <AppStatusPill
                        label={
                          attendee.isRegistered
                            ? "REGISTERED"
                            : "NOT REGISTERED"
                        }
                        tone={attendee.isRegistered ? "success" : "warning"}
                      />
                      {attendee.gender ? (
                        <AppStatusPill
                          label={toDisplayUpper(attendee.gender)}
                          tone="neutral"
                        />
                      ) : null}
                      {attendee.category ? (
                        <AppStatusPill
                          label={toDisplayUpper(attendee.category)}
                          tone="primary"
                        />
                      ) : null}
                      {attendee.assignedPass ? (
                        <AppStatusPill label="PASS ASSIGNED" tone="success" />
                      ) : (
                        <AppStatusPill label="NO PASS YET" tone="warning" />
                      )}
                    </div>

                    <h4 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words uppercase leading-tight">
                      {attendee.fullName}
                    </h4>

                    <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-2">
                      <InfoCard
                        icon={<Hash className="w-4 h-4" />}
                        label="UNIQUE ID"
                        value={toDisplayUpper(attendee.uniqueId)}
                      />
                      <InfoCard
                        icon={<Phone className="w-4 h-4" />}
                        label="Phone"
                        value={toDisplayUpper(attendee.phone)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details Grid */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                <InfoCard
                  icon={<UserRound className="w-4 h-4" />}
                  label="Age"
                  value={attendee.age ? toDisplayUpper(attendee.age) : "—"}
                />
                <InfoCard
                  icon={<MapPin className="w-4 h-4" />}
                  label="State / LGA"
                  value={toDisplayUpper(
                    [attendee.state, attendee.lga].filter(Boolean).join(" / ")
                  )}
                />
                <InfoCard
                  icon={<MapPin className="w-4 h-4" />}
                  label="Ward / Community"
                  value={toDisplayUpper(
                    [attendee.ward, attendee.community]
                      .filter(Boolean)
                      .join(" / ")
                  )}
                />
                <InfoCard
                  icon={<Landmark className="w-4 h-4" />}
                  label="Religion"
                  value={toDisplayUpper(attendee.religion)}
                />
                <InfoCard
                  icon={<CalendarDays className="w-4 h-4" />}
                  label="Accredited On"
                  value={formatDisplayDateTime(attendee.registeredAt)}
                />
              </div>

              {/* Assignment Info */}
              {(attendee.color || attendee.subCL) && (
                <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Community Assignment
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {attendee.color && (
                      <InfoCard
                        icon={<Palette className="w-4 h-4" />}
                        label="ASSIGNED COLOR"
                        value={toDisplayUpper(attendee.color.name)}
                        color={attendee.color.hexCode || undefined}
                      />
                    )}
                    {attendee.subCL && (
                      <InfoCard
                        icon={<UserCheck className="w-4 h-4" />}
                        label="SUB COMMUNITY LEADER"
                        value={toDisplayUpper(
                          attendee.subCL.name || `SubCL #${attendee.subCL.subClId}`
                        )}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Assigned Pass Section */}
              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  Assigned Pass
                </h4>

                {attendee.assignedPass ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoCard
                      icon={<Hash className="w-4 h-4" />}
                      label="Serial Number"
                      value={toDisplayUpper(attendee.assignedPass.serialNumber)}
                    />
                    <InfoCard
                      icon={<BadgeCheck className="w-4 h-4" />}
                      label="Status"
                      value={toDisplayUpper(attendee.assignedPass.status)}
                    />
                    <InfoCard
                      icon={<CalendarDays className="w-4 h-4" />}
                      label="Assigned At"
                      value={formatDisplayDateTime(
                        attendee.assignedPass.assignedAt
                      )}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 uppercase">
                    No pass assigned yet.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Registration Form */}
            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                  Register Attendee
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Enter the printed QR serial number and confirm accommodation.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="block mb-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                      Printed QR Serial Number
                    </label>
                    <div className="relative">
                      <Input
                        ref={serialInputRef}
                        className="pl-12 h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-sm uppercase text-base font-semibold focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                        placeholder="E.G. EVT2026-000245"
                        value={serialNumber}
                        onChange={(e) =>
                          setSerialNumber(e.target.value.toUpperCase())
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && canRegister) {
                            e.preventDefault();
                            onRegister();
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center ml-4 text-gray-400 pointer-events-none">
                        <Hash className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                      Accommodation
                    </label>
                    <div className="relative">
                      <Select
                        className="h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-sm uppercase pl-12 text-base font-semibold focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                        value={accommodation}
                        onChange={(e) => setAccommodation(e.target.value)}
                      >
                        <option value="">SELECT ACCOMMODATION</option>
                        <option value="ROYAL CHOICE INN">
                          ROYAL CHOICE INN
                        </option>
                        <option value="CONFERENCE CENTER HALL">
                          CONFERENCE CENTER HALL
                        </option>
                      </Select>
                      <div className="absolute inset-y-0 left-0 flex items-center ml-4 text-gray-400 pointer-events-none">
                        <Home className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="mt-6 space-y-3">
                  {[
                    {
                      ok: true,
                      label: "ATTENDEE RECORD LOADED",
                    },
                    {
                      ok: Boolean(serialNumber.trim()),
                      label: "QR SERIAL NUMBER ENTERED",
                    },
                    {
                      ok: Boolean(accommodation.trim()),
                      label: "ACCOMMODATION SELECTED",
                    },
                    {
                      ok: canRegister,
                      label: "READY FOR REGISTRATION",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border-2 p-4 transition-all duration-300 ${
                        item.ok
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20"
                          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.ok ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 animate-scaleIn" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-400 shrink-0" />
                        )}
                        <span
                          className={`text-sm font-bold uppercase ${
                            item.ok
                              ? "text-emerald-800 dark:text-emerald-200"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {!canRegister && (
                  <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-200 uppercase leading-relaxed font-medium">
                      {attendee.isRegistered
                        ? "⚠️ THIS ATTENDEE IS ALREADY REGISTERED."
                        : "⚠️ ENTER QR SERIAL NUMBER AND SELECT ACCOMMODATION BEFORE REGISTERING."}
                    </p>
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    type="button"
                    disabled={!canRegister}
                    className="rounded-2xl h-14 w-full bg-gradient-to-r from-green-600 to-emerald-600 border-0 hover:from-green-700 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    onClick={onRegister}
                  >
                    <span className="inline-flex items-center justify-center gap-3 uppercase font-bold text-base">
                      {registering ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <BadgeCheck className="w-5 h-5" />
                      )}
                      {registering ? "Registering..." : "Register Attendee"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationDeskPage() {
  const router = useRouter();
  const eventId = 1;

  const [searchQuery, setSearchQuery] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [registeredSearch, setRegisteredSearch] = useState("");
  const [registeredPage, setRegisteredPage] = useState(1);

  const [attendee, setAttendee] = useState<AttendeeData | null>(null);
  const [registeredAttendees, setRegisteredAttendees] = useState<
    RegisteredAttendeeRow[]
  >([]);

  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const serialInputRef = useRef<HTMLInputElement | null>(null);

  const registeredResultsPerPage = 10;

  const canRegister = useMemo(() => {
    return Boolean(
      attendee &&
        serialNumber.trim() &&
        accommodation.trim() &&
        !attendee.isRegistered &&
        !registering
    );
  }, [attendee, serialNumber, accommodation, registering]);

  const filteredRegisteredAttendees = useMemo(() => {
    const term = registeredSearch.trim().toLowerCase();

    if (!term) return registeredAttendees;

    return registeredAttendees.filter((item) => {
      const fullName = item.fullName?.toLowerCase() || "";
      const phone = item.phone?.toLowerCase() || "";
      const uniqueId = item.uniqueId?.toLowerCase() || "";
      const serialNumber = item.serialNumber?.toLowerCase() || "";
      const color = item.color?.toLowerCase() || "";
      const subcl = item.subcl?.toLowerCase() || "";

      return (
        fullName.includes(term) ||
        phone.includes(term) ||
        uniqueId.includes(term) ||
        serialNumber.includes(term) ||
        color.includes(term) ||
        subcl.includes(term)
      );
    });
  }, [registeredAttendees, registeredSearch]);

  const paginatedRegisteredAttendees = useMemo(() => {
    const start = (registeredPage - 1) * registeredResultsPerPage;
    return filteredRegisteredAttendees.slice(
      start,
      start + registeredResultsPerPage
    );
  }, [filteredRegisteredAttendees, registeredPage, registeredResultsPerPage]);

  useEffect(() => {
    if (!router.isReady) return;
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [router.isReady]);

  useEffect(() => {
    fetchRegisteredAttendees();
  }, []);

  useEffect(() => {
    setRegisteredPage(1);
  }, [registeredSearch]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredRegisteredAttendees.length / registeredResultsPerPage)
    );

    if (registeredPage > totalPages) {
      setRegisteredPage(totalPages);
    }
  }, [
    filteredRegisteredAttendees.length,
    registeredPage,
    registeredResultsPerPage,
  ]);

  async function fetchRegisteredAttendees() {
    try {
      setLoadingRegistered(true);
      const { data } = await api.get<ApiSuccess<RegisteredAttendeesResponse>>(
        `/events/${eventId}/registered-attendees`
      );
      setRegisteredAttendees(data.data.attendees || []);
    } catch (err: any) {
      setRegisteredAttendees([]);
    } finally {
      setLoadingRegistered(false);
    }
  }

  function resetAll() {
    setSearchQuery("");
    setSerialNumber("");
    setAccommodation("");
    setAttendee(null);
    setIsModalOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSerialNumber("");
    setAccommodation("");
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }

  async function handleSearchAttendee(e?: FormEvent) {
    e?.preventDefault();

    if (!searchQuery.trim()) {
      toast.error("Enter phone number or unique ID.");
      return;
    }

    if (!eventId) {
      toast.error("Event ID is missing.");
      return;
    }

    try {
      setSearching(true);
      setAttendee(null);
      setIsModalOpen(false);
      setSerialNumber("");
      setAccommodation("");

      const { data } = await api.post<ApiSuccess<SearchResponseData>>(
        `/search`,
        {
          q: searchQuery.trim(),
          eventId,
        }
      );

      const nextAttendee = {
        ...data.data.attendee,
        assignedPass: data.data.assignedPass,
      };

      setAttendee(nextAttendee);
      setAccommodation(getSuggestedAccommodation(nextAttendee.gender));
      setIsModalOpen(true);

      toast.success(data.message || "Attendee found.");
      setTimeout(() => serialInputRef.current?.focus(), 150);
    } catch (err: any) {
      setAttendee(null);
      setIsModalOpen(false);
      toast.error(err?.response?.data?.message || "Unable to find attendee.");
    } finally {
      setSearching(false);
    }
  }

  async function handleRegister() {
    if (!eventId) {
      toast.error("Event ID is missing.");
      return;
    }

    if (!attendee?.attendeeId) {
      toast.error("Search and confirm attendee first.");
      return;
    }

    if (!serialNumber.trim()) {
      toast.error("Enter QR serial number.");
      return;
    }

    if (!accommodation.trim()) {
      toast.error("Select accommodation.");
      return;
    }

    try {
      setRegistering(true);

      const { data } = await api.post<
        ApiSuccess<{
          attendee: {
            attendeeId: number;
            fullName: string;
            phone: string | null;
            uniqueId: string | null;
            isRegistered: boolean;
            registeredAt: string | null;
          };
          pass: {
            passId: number;
            serialNumber: string;
            status: string;
            isAssigned: boolean;
            assignedAt: string | null;
          };
          color: ColorData;
          subCL: SubCLData;
        }>
      >(`/events/${eventId}/registrations`, {
        attendeeId: attendee.attendeeId,
        serialNumber: serialNumber.trim(),
        accommodation: accommodation.trim(),
      });

      const colorInfo = data.data.color
        ? ` | Color: ${data.data.color.name}`
        : "";
      const subCLInfo = data.data.subCL
        ? ` | SubCL: ${data.data.subCL.name || `#${data.data.subCL.subClId}`}`
        : "";

      toast.success(
        `${data.data.attendee.fullName} registered successfully!${colorInfo}${subCLInfo}`,
        { duration: 5000 }
      );

      await fetchRegisteredAttendees();

      setTimeout(() => {
        setSearchQuery("");
        setSerialNumber("");
        setAccommodation("");
        setAttendee(null);
        setIsModalOpen(false);
        searchInputRef.current?.focus();
      }, 1000);
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      let message =
        err?.response?.data?.message || "Failed to register attendee.";

      if (validationErrors && typeof validationErrors === "object") {
        const firstKey = Object.keys(validationErrors)[0];
        if (firstKey && validationErrors[firstKey]?.[0]) {
          message = validationErrors[firstKey][0];
        }
      }

      toast.error(message);
    } finally {
      setRegistering(false);
    }
  }

  return (
    <Layout>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 640px) {
          .animate-slideUp {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }
      `}</style>

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <PageTitle>Registration Desk</PageTitle>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Search attendees, verify details, assign QR passes, and register
              participants with automatic color and SubCL assignment.
            </p>
          </div>

          <Button
            layout="outline"
            className="rounded-2xl h-12 w-full sm:w-auto border-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            onClick={resetAll}
          >
            <span className="inline-flex items-center justify-center gap-2 w-full font-semibold">
              <RefreshCcw className="w-4 h-4" />
              Reset
            </span>
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-xl p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" />
            Search Attendee
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Find the attendee by phone number or unique ID. Details will open in
            a modal.
          </p>
        </div>

        <form onSubmit={handleSearchAttendee} className="space-y-5">
          <div>
            <label className="block mb-3 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Phone Number or Unique ID
            </label>

            <div className="relative">
              <Input
                ref={searchInputRef}
                className="pl-12 h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-sm text-base font-semibold focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                placeholder="e.g. 08031234567 or ISM/B2/M/00001"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center ml-4 text-gray-400 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={searching}
            className="rounded-2xl h-14 w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 border-0 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="inline-flex items-center justify-center gap-3 w-full font-bold text-base uppercase">
              {searching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {searching ? "Searching..." : "Search Attendee"}
            </span>
          </Button>
        </form>

        {attendee && (
          <div className="mt-6 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-5">
            <p className="text-xs text-green-700 dark:text-green-300 uppercase font-bold mb-2">
              Last Loaded Attendee
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white uppercase break-words">
              {attendee.fullName}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                className="rounded-2xl h-12 w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 border-0 hover:from-green-700 hover:to-emerald-700 shadow-md"
                onClick={() => setIsModalOpen(true)}
              >
                <span className="font-bold">Open Registration Modal</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Registered Attendees Section */}
      <div className="mt-8 rounded-3xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-xl p-6 sm:p-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Registered Attendees
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Browse and search all registered attendees with their assigned
                colors and SubCLs.
              </p>
            </div>

            <Button
              type="button"
              layout="outline"
              className="rounded-2xl h-11 w-full sm:w-auto border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={fetchRegisteredAttendees}
            >
              <span className="font-semibold">Refresh</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="block mb-3 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Search Registered Attendees
              </label>
              <div className="relative">
                <Input
                  className="pl-12 h-14 rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-sm text-base font-semibold focus:border-green-500 focus:ring-green-500"
                  placeholder="Search by name, phone, unique ID, serial, color, or SubCL"
                  value={registeredSearch}
                  onChange={(e) => setRegisteredSearch(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center ml-4 text-gray-400 pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase text-center">
              {loadingRegistered
                ? "Loading..."
                : `${filteredRegisteredAttendees.length} result${
                    filteredRegisteredAttendees.length === 1 ? "" : "s"
                  }`}
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="block lg:hidden">
          {loadingRegistered ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">
                Loading registered attendees...
              </p>
            </div>
          ) : filteredRegisteredAttendees.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">
                No matching registered attendees found.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedRegisteredAttendees.map((item) => (
                  <RegisteredAttendeeMobileCard
                    key={item.attendeeId}
                    item={item}
                  />
                ))}
              </div>

              <div className="mt-6">
                <Pagination
                  totalResults={filteredRegisteredAttendees.length}
                  resultsPerPage={registeredResultsPerPage}
                  onChange={setRegisteredPage}
                  label="Registered attendees navigation"
                />
              </div>
            </>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide font-bold text-gray-600 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-700">
                <th className="py-4 pr-4">Name</th>
                <th className="py-4 pr-4">Unique ID</th>
                <th className="py-4 pr-4">Phone</th>
                <th className="py-4 pr-4">Gender</th>
                <th className="py-4 pr-4">Accommodation</th>
                <th className="py-4 pr-4">Color</th>
                <th className="py-4 pr-4">SubCL</th>
                <th className="py-4 pr-4">Serial</th>
                <th className="py-4 pr-0">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {loadingRegistered ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-sm text-gray-500 dark:text-gray-400 uppercase"
                  >
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600" />
                    <p className="mt-4 font-semibold">
                      Loading registered attendees...
                    </p>
                  </td>
                </tr>
              ) : filteredRegisteredAttendees.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-sm text-gray-500 dark:text-gray-400 uppercase"
                  >
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="mt-4 font-semibold">
                      No matching registered attendees found.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRegisteredAttendees.map((item) => (
                  <tr
                    key={item.attendeeId}
                    className="border-b border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                  >
                    <td className="py-4 pr-4 font-bold uppercase whitespace-nowrap">
                      {toDisplayUpper(item.fullName)}
                    </td>
                    <td className="py-4 pr-4 uppercase whitespace-nowrap font-medium">
                      {toDisplayUpper(item.uniqueId)}
                    </td>
                    <td className="py-4 pr-4 uppercase whitespace-nowrap">
                      {toDisplayUpper(item.phone)}
                    </td>
                    <td className="py-4 pr-4 uppercase whitespace-nowrap">
                      {toDisplayUpper(item.gender)}
                    </td>
                    <td className="py-4 pr-4 uppercase whitespace-nowrap">
                      {toDisplayUpper(item.accommodation)}
                    </td>
                    <td className="py-4 pr-4 whitespace-nowrap">
                      <ColorBadge
                        colorName={item.color}
                        hexCode={item.colorHex}
                      />
                    </td>
                    <td className="py-4 pr-4 uppercase whitespace-nowrap font-medium">
                      {toDisplayUpper(item.subcl)}
                    </td>
                    <td className="py-4 pr-4 uppercase whitespace-nowrap font-mono text-xs">
                      {toDisplayUpper(item.serialNumber)}
                    </td>
                    <td className="py-4 pr-0 uppercase whitespace-nowrap text-xs">
                      {formatDisplayDateTime(item.registeredAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loadingRegistered && filteredRegisteredAttendees.length > 0 && (
            <div className="mt-6">
              <Pagination
                totalResults={filteredRegisteredAttendees.length}
                resultsPerPage={registeredResultsPerPage}
                onChange={setRegisteredPage}
                label="Registered attendees navigation"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pb-20"></div>

      <RegistrationModal
        isOpen={isModalOpen}
        attendee={attendee}
        serialNumber={serialNumber}
        setSerialNumber={setSerialNumber}
        accommodation={accommodation}
        setAccommodation={setAccommodation}
        registering={registering}
        canRegister={canRegister}
        onClose={closeModal}
        onRegister={handleRegister}
        serialInputRef={serialInputRef}
      />
    </Layout>
  );
}