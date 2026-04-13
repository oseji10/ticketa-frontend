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
  color?: string | null;
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
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "primary" | "neutral";
}) {
  return <Badge type={tone as any}>{label}</Badge>;
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-2 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white break-words uppercase">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisteredAttendeeMobileCard({
  item,
}: {
  item: RegisteredAttendeeRow;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-900/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900 dark:text-white uppercase break-words">
            {toDisplayUpper(item.fullName)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 uppercase">
            {toDisplayUpper(item.uniqueId)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full h-[92dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-6xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white uppercase">
                Attendee Registration
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 uppercase leading-relaxed">
                Confirm attendee details, enter the printed QR serial number,
                choose accommodation, and complete registration.
              </p>
            </div>

            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 bg-white dark:bg-gray-800">
                <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
                  <div className="h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center shrink-0">
                    {attendee.photoUrl ? (
                      <img
                        src={attendee.photoUrl}
                        alt={attendee.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 w-full text-center md:text-left">
                    <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
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

                    <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words uppercase">
                      {attendee.fullName}
                    </h4>

                    <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
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
                    [attendee.state, attendee.lga].filter(Boolean).join(" / "),
                  )}
                />
                <InfoCard
                  icon={<MapPin className="w-4 h-4" />}
                  label="Ward / Community"
                  value={toDisplayUpper(
                    [attendee.ward, attendee.community]
                      .filter(Boolean)
                      .join(" / "),
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

              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/20">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
                  Assigned Pass
                </h4>

                {attendee.assignedPass ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
                        attendee.assignedPass.assignedAt,
                      )}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 uppercase">
                    No pass assigned yet.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 bg-gray-50 dark:bg-gray-900/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white uppercase">
                  Register Attendee
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 uppercase leading-relaxed">
                  Enter the printed QR serial number and confirm accommodation.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Printed QR Serial Number
                    </label>
                    <div className="relative">
                      <Input
                        ref={serialInputRef}
                        className="pl-11 h-12 rounded-2xl border-gray-200 dark:border-gray-600 shadow-sm uppercase"
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
                        <Hash className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Accommodation
                    </label>
                    <div className="relative">
                      <Select
                        className="h-12 rounded-2xl border-gray-200 dark:border-gray-600 shadow-sm uppercase pl-10"
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
                        <Home className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

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
                      className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                    >
                      <div className="flex items-center gap-3">
                        {item.ok ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 uppercase">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {!canRegister ? (
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 uppercase leading-relaxed">
                    {attendee.isRegistered
                      ? "THIS ATTENDEE IS ALREADY REGISTERED."
                      : "ENTER QR SERIAL NUMBER AND SELECT ACCOMMODATION BEFORE REGISTERING."}
                  </p>
                ) : null}

                <div className="mt-6">
                  <Button
                    type="button"
                    disabled={!canRegister}
                    className="rounded-2xl h-12 w-full bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800 disabled:opacity-60"
                    onClick={onRegister}
                  >
                    <span className="inline-flex items-center gap-2 uppercase">
                      {registering ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <BadgeCheck className="w-4 h-4" />
                      )}
                      Register Attendee
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
      !registering,
    );
  }, [attendee, serialNumber, accommodation, registering]);

  const filteredRegisteredAttendees = useMemo(() => {
    const term = registeredSearch.trim().toLowerCase();

    if (!term) return registeredAttendees;

    return registeredAttendees.filter((item) => {
      const fullName = item.fullName?.toLowerCase() || "";
      const phone = item.phone?.toLowerCase() || "";
      const serialNumber = item.serialNumber?.toLowerCase() || "";

      return (
        fullName.includes(term) ||
        phone.includes(term) ||
        serialNumber.includes(term)
      );
    });
  }, [registeredAttendees, registeredSearch]);

  const paginatedRegisteredAttendees = useMemo(() => {
    const start = (registeredPage - 1) * registeredResultsPerPage;
    return filteredRegisteredAttendees.slice(
      start,
      start + registeredResultsPerPage,
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
      Math.ceil(filteredRegisteredAttendees.length / registeredResultsPerPage),
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
        `/events/${eventId}/registered-attendees`,
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
        },
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
        }>
      >(`/events/${eventId}/registrations`, {
        attendeeId: attendee.attendeeId,
        serialNumber: serialNumber.trim(),
        accommodation: accommodation.trim(),
      });

      toast.success(
        data.message ||
          `${data.data.attendee.fullName} registered successfully.`,
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
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <PageTitle>Registration Desk</PageTitle>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Search attendees, open their details in a modal, enter a printed
              QR serial number, confirm accommodation, and register them on
              arrival.
            </p>
          </div>

          <Button
            layout="outline"
            className="rounded-2xl h-11 w-full sm:w-auto"
            onClick={resetAll}
          >
            <span className="inline-flex items-center justify-center gap-2 w-full">
              <RefreshCcw className="w-4 h-4" />
              Reset
            </span>
          </Button>
        </div>

        <div className="mt-4 rounded-3xl overflow-hidden bg-gradient-to-r from-green-900 via-green-800 to-green-700 shadow-xl">
          <div className="px-4 py-5 sm:px-8 sm:py-8 text-white">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-wide uppercase">
                Event Registration
              </div>

              <h2 className="mt-4 text-xl sm:text-3xl font-bold leading-tight">
                Fast attendee check-in and QR pass assignment
              </h2>

              <p className="mt-3 text-sm sm:text-base text-green-100 leading-6">
                Search by phone number or unique ID, review the attendee record
                in a modal, enter the printed QR serial number, confirm
                accommodation, and complete registration quickly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4 sm:p-5">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Search Attendee
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 uppercase leading-relaxed">
            Find the attendee by phone number or unique ID. Details will open in
            a modal.
          </p>
        </div>

        <form onSubmit={handleSearchAttendee} className="space-y-5">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number or Unique ID
            </label>

            <div className="relative">
              <Input
                ref={searchInputRef}
                className="pl-11 h-12 rounded-2xl border-gray-200 dark:border-gray-600 shadow-sm"
                placeholder="e.g. 08031234567 or REG-1022"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center ml-4 text-gray-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={searching}
            className="rounded-2xl h-12 w-full sm:w-auto bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800"
          >
            <span className="inline-flex items-center justify-center gap-2 w-full">
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search Attendee
            </span>
          </Button>
        </form>

        {attendee ? (
          <div className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 uppercase">
              Last Loaded Attendee
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white uppercase break-words">
              {attendee.fullName}
            </p>
            <div className="mt-3">
              <Button
                type="button"
                className="rounded-2xl h-11 w-full sm:w-auto bg-green-700 border-green-700 hover:bg-green-800 hover:border-green-800"
                onClick={() => setIsModalOpen(true)}
              >
                Open Registration Modal
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg p-4 sm:p-5">
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Registered Attendees
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 uppercase leading-relaxed">
                Search and browse registered attendees by name, phone number, or
                serial number.
              </p>
            </div>

            <Button
              type="button"
              layout="outline"
              className="rounded-2xl h-10 w-full sm:w-auto"
              onClick={fetchRegisteredAttendees}
            >
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Registered Attendees
              </label>
              <div className="relative">
                <Input
                  className="pl-11 h-12 rounded-2xl border-gray-200 dark:border-gray-600 shadow-sm"
                  placeholder="Search by name, phone number or serial number"
                  value={registeredSearch}
                  onChange={(e) => setRegisteredSearch(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center ml-4 text-gray-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 uppercase">
              {loadingRegistered
                ? "Loading..."
                : `${filteredRegisteredAttendees.length} result${
                    filteredRegisteredAttendees.length === 1 ? "" : "s"
                  }`}
            </div>
          </div>
        </div>

        <div className="block lg:hidden">
          {loadingRegistered ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 uppercase">
              Loading registered attendees...
            </div>
          ) : filteredRegisteredAttendees.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 uppercase">
              No matching registered attendees found.
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

              <div className="mt-5">
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

        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Unique ID</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Gender</th>
                <th className="py-3 pr-4">Accommodation</th>
                <th className="py-3 pr-4">Serial</th>
                <th className="py-3 pr-0">Registered At</th>
              </tr>
            </thead>
            <tbody>
              {loadingRegistered ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 uppercase"
                  >
                    Loading registered attendees...
                  </td>
                </tr>
              ) : filteredRegisteredAttendees.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 uppercase"
                  >
                    No matching registered attendees found.
                  </td>
                </tr>
              ) : (
                paginatedRegisteredAttendees.map((item) => (
                  <tr
                    key={item.attendeeId}
                    className="border-b border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <td className="py-4 pr-4 font-semibold uppercase whitespace-nowrap">
                      {toDisplayUpper(item.fullName)}
                    </td>
                    <td className="py-4 pr-4 uppercase whitespace-nowrap">
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
                    <td className="py-4 pr-4 uppercase whitespace-nowrap">
                      {toDisplayUpper(item.serialNumber)}
                    </td>
                    <td className="py-4 pr-0 uppercase whitespace-nowrap">
                      {formatDisplayDateTime(item.registeredAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loadingRegistered && filteredRegisteredAttendees.length > 0 ? (
            <div className="mt-5">
              <Pagination
                totalResults={filteredRegisteredAttendees.length}
                resultsPerPage={registeredResultsPerPage}
                onChange={setRegisteredPage}
                label="Registered attendees navigation"
              />
            </div>
          ) : null}
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
