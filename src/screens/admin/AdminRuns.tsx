import { useState, useEffect } from "react";
import type { Hospital, PeriodData } from "@/types";
import { RunStatus } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Plus,
  Folder,
  Play,
  ArrowRight,
  FolderOpen,
  Clock,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  HospitalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/Modal";
import { FileUploadZone } from "@/components/FileUploadZone";
import { formatFileSize, getFileTypeCategory } from "@/lib/fileUtils";
import {
  getDirectorySasToken,
  uploadMultipleFilesToAzure,
  getHospitalsFromApi,
  createHospitalApi,
  deleteHospitalApi,
  getMonthsFromApi,
  createMonthApi,
  deleteMonthApi,
  getFilesByType,
  deleteFileApi,
  startWorkflowApi,
  startRunApi,
} from "@/service/api";
import type { UploadProgress, FilesByTypeResponse } from "@/service/types";
import { ApiError } from "@/service/types";
import api from "@/service/api";
import { PREDEFINED_HOSPITALS } from "@/constants/hospitals";

export const AdminRuns: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [months, setMonths] = useState<PeriodData[]>([]);
  const [runsLevel, setRunsLevel] = useState<
    "hospitals" | "months" | "details"
  >("hospitals");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null,
  );
  const [selectedMonth, setSelectedMonth] = useState<PeriodData | null>(null);

  // Loading states
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [isLoadingMonths, setIsLoadingMonths] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing files from blob storage
  const [existingFiles, setExistingFiles] = useState<FilesByTypeResponse | null>(null);

  function isValidMonthYear(value: string): boolean {
    // MM/YYYY
    const regex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    return regex.test(value);
  }
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"hospital" | "month" | "monthWithHospitalSelect" | null>(null);
  const [selectedHospitalForMonth, setSelectedHospitalForMonth] = useState<string>("");
  const [isCustomHospital, setIsCustomHospital] = useState(false);

  const [newHospital, setNewHospital] = useState<{
    name: string;
    code: string;
  }>({ name: "", code: "" });
  const [newMonth, setNewMonth] = useState<{ month: string }>({ month: "" });

  const [uploadedFiles, setUploadedFiles] = useState<{
    [categoryId: string]: File[];
  }>({
    hospitalization: [],
    ambulatory: [],
    er: [],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [categoryId: string]: { [fileIndex: number]: UploadProgress };
  }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Fetch hospitals when on hospitals view
  useEffect(() => {
    const fetchHospitals = async () => {
      if (runsLevel === "hospitals") {
        setIsLoadingHospitals(true);
        setErrorMessage(null);
        try {
          const hospitalsData = await getHospitalsFromApi();
          setHospitals(hospitalsData);
        } catch (error) {
          if (error instanceof ApiError) {
            setErrorMessage(`שגיאה בטעינת בתי החולים: ${error.message}`);
          } else {
            setErrorMessage("שגיאה בלתי צפויה בטעינת בתי החולים");
          }
        } finally {
          setIsLoadingHospitals(false);
        }
      }
    };

    fetchHospitals();
  }, [runsLevel]);

  // Fetch months when hospital is selected
  useEffect(() => {
    const fetchMonths = async () => {
      if (runsLevel === "months" && selectedHospital) {
        setIsLoadingMonths(true);
        setErrorMessage(null);
        try {
          const monthsData = await getMonthsFromApi(selectedHospital.name);
          setMonths(monthsData);
        } catch (error) {
          if (error instanceof ApiError) {
            setErrorMessage(`שגיאה בטעינת החודשים: ${error.message}`);
          } else {
            setErrorMessage("שגיאה בלתי צפויה בטעינת החודשים");
          }
        } finally {
          setIsLoadingMonths(false);
        }
      }
    };

    fetchMonths();
  }, [runsLevel, selectedHospital]);

  // Fetch files when month is selected
  useEffect(() => {
    const fetchFiles = async () => {
      if (runsLevel === "details" && selectedHospital && selectedMonth) {
        setIsLoadingFiles(true);
        setErrorMessage(null);
        try {
          const { year, month } = api.parseMonthYear(selectedMonth.period);
          const filesData = await getFilesByType(
            selectedHospital.name,
            year,
            month
          );
          setExistingFiles(filesData);
        } catch (error) {
          if (error instanceof ApiError) {
            setErrorMessage(`שגיאה בטעינת הקבצים: ${error.message}`);
          } else {
            setErrorMessage("שגיאה בלתי צפויה בטעינת הקבצים");
          }
        } finally {
          setIsLoadingFiles(false);
        }
      }
    };

    fetchFiles();
  }, [runsLevel, selectedHospital, selectedMonth]);

  const handleCreateHospital = async () => {
    setErrorMessage(null);
    try {
      await createHospitalApi(newHospital.name, newHospital.code);
      setIsModalOpen(false);
      setNewHospital({ name: "", code: "" });
      // Refresh hospitals list
      const hospitalsData = await getHospitalsFromApi();
      setHospitals(hospitalsData);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(`שגיאה ביצירת בית חולים: ${error.message}`);
      } else {
        setErrorMessage("שגיאה בלתי צפויה ביצירת בית חולים");
      }
    }
  };

  const handleCreateMonth = async () => {
    // Use selectedHospitalForMonth if creating from main view, otherwise use selectedHospital
    const hospitalName = modalType === "monthWithHospitalSelect"
      ? selectedHospitalForMonth
      : selectedHospital?.name;

    if (!hospitalName) return;

    setErrorMessage(null);
    try {
      await createMonthApi(hospitalName, newMonth.month);
      setIsModalOpen(false);
      setNewMonth({ month: "" });
      setSelectedHospitalForMonth("");
      // Refresh months list if we're in the months view
      if (selectedHospital && selectedHospital.name === hospitalName) {
        const monthsData = await getMonthsFromApi(hospitalName);
        setMonths(monthsData);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(`שגיאה ביצירת חודש: ${error.message}`);
      } else {
        setErrorMessage("שגיאה בלתי צפויה ביצירת חודש");
      }
    }
  };

  const handleSelectMonth = (month: PeriodData) => {
    setSelectedMonth(month);
    setRunsLevel("details");
  };

  const handleFilesSelected = async (categoryId: string, files: File[]) => {
    if (!selectedHospital || !selectedMonth || files.length === 0) return;

    // Add files to state immediately for UI feedback
    setUploadedFiles((prev) => ({
      ...prev,
      [categoryId]: [...prev[categoryId], ...files],
    }));

    // Upload files immediately
    await uploadFilesForCategory(categoryId, files);
  };

  const uploadFilesForCategory = async (categoryId: string, files: File[]) => {
    if (!selectedHospital || !selectedMonth) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Parse month format (MM/YYYY) to YYYY-MM for backend
      const [month, year] = selectedMonth.period.split("/");
      const dateStr = `${year}-${month}`;

      // Get SAS token from backend
      const sasData = await getDirectorySasToken("/admin/directories/upload-url", {
        provider_name: selectedHospital.name,
        date: dateStr,
        workflow_type: categoryId,
      });

      // Upload files with progress tracking
      await uploadMultipleFilesToAzure(files, sasData, (fileIndex, progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            [fileIndex]: progress,
          },
        }));
      });

      // Start workflow for this category
      const [monthStr, yearStr] = selectedMonth.period.split("/");
      const yearNum = parseInt(yearStr, 10);
      const monthNum = parseInt(monthStr, 10);
      await startWorkflowApi(selectedHospital.id, yearNum, monthNum, categoryId);

      // Show success
      setUploadSuccess(true);

      // Auto-refresh files list from blob storage
      try {
        const { year, month } = api.parseMonthYear(selectedMonth.period);
        const filesData = await getFilesByType(
          selectedHospital.name,
          year,
          month
        );
        setExistingFiles(filesData);
      } catch (refreshError) {
        console.error("Failed to refresh files list:", refreshError);
      }

      // Clear uploaded files for this category after successful upload
      setTimeout(() => {
        setUploadedFiles((prev) => ({
          ...prev,
          [categoryId]: [],
        }));
        setUploadProgress((prev) => ({
          ...prev,
          [categoryId]: {},
        }));
        setUploadSuccess(false);
      }, 3000);

    } catch (error) {
      if (error instanceof ApiError) {
        setUploadError(error.message);
      } else {
        setUploadError("שגיאה בלתי צפויה בעת העלאת הקבצים");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = (categoryId: string, fileIndex: number) => {
    setUploadedFiles((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId].filter((_, index) => index !== fileIndex),
    }));
  };

  const handleDeleteHospital = async (hospitalName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את בית החולים ${hospitalName}? פעולה זו תמחק את כל התיקיות והקבצים.`)) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteHospitalApi(hospitalName);
      // Refresh hospitals list
      const hospitalsData = await getHospitalsFromApi();
      setHospitals(hospitalsData);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(`שגיאה במחיקת בית חולים: ${error.message}`);
      } else {
        setErrorMessage("שגיאה בלתי צפויה במחיקת בית חולים");
      }
    }
  };

  const handleDeleteMonth = async (monthStr: string) => {
    if (!selectedHospital) return;

    if (!confirm(`האם אתה בטוח שברצונך למחוק את חודש ${monthStr}? פעולה זו תמחק את כל הקבצים.`)) {
      return;
    }

    setErrorMessage(null);
    try {
      const { year, month } = api.parseMonthYear(monthStr);
      await deleteMonthApi(selectedHospital.name, year, month);
      // Refresh months list
      const monthsData = await getMonthsFromApi(selectedHospital.name);
      setMonths(monthsData);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(`שגיאה במחיקת חודש: ${error.message}`);
      } else {
        setErrorMessage("שגיאה בלתי צפויה במחיקת חודש");
      }
    }
  };

  const handleDeleteExistingFile = async (
    workflowType: string,
    fileName: string
  ) => {
    if (!selectedHospital || !selectedMonth) return;

    if (!confirm(`האם אתה בטוח שברצונך למחוק את הקובץ ${fileName}?`)) {
      return;
    }

    setErrorMessage(null);
    try {
      const { year, month } = api.parseMonthYear(selectedMonth.period);
      await deleteFileApi(
        selectedHospital.name,
        year,
        month,
        workflowType,
        fileName
      );
      // Refresh files list
      const filesData = await getFilesByType(
        selectedHospital.name,
        year,
        month
      );
      setExistingFiles(filesData);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(`שגיאה במחיקת קובץ: ${error.message}`);
      } else {
        setErrorMessage("שגיאה בלתי צפויה במחיקת קובץ");
      }
    }
  };

  const handleRunUpload = async () => {
    if (!selectedHospital || !selectedMonth) return;

    try {
      const { year, month } = api.parseMonthYear(selectedMonth.period);
      await startRunApi(selectedHospital.id, year, month);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("שגיאה בלתי צפויה בהפעלת הרצה");
      }
    }
  };

  if (runsLevel === "hospitals") {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div className="text-right">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              ניהול תיקיות והרצות
            </h1>
            <p className="text-slate-500 mt-1">
              בחר בית חולים לניהול תיקיות, הקצות וקבצים
            </p>
          </div>
          <Button
            className="gap-2 transition-all"
            onClick={() => {
              setModalType("hospital");
              setIsModalOpen(true);
            }}
          >
            <Plus size={20} /> בית חולים חדש
          </Button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-800">שגיאה</h4>
                <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800 hover:bg-red-100"
              >
                סגור
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoadingHospitals && (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={40} className="animate-spin text-blue-600" />
          </div>
        )}

        {/* Hospitals Grid */}
        {!isLoadingHospitals && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hospitals.map((h) => (
              <Card
                key={h.code}
                className="hover:border-blue-400 transition-all group relative overflow-hidden shadow-sm hover:shadow-md pt-2"
              >
                {/* Specific "New Files" Tab Style as requested */}
                {h.hasPendingUploads && (
                  <div className="absolute top-0 right-0 bg-amber-50 border-b border-r border-amber-200 rounded-br-xl px-4 py-1.5 flex items-center gap-2 shadow-sm z-10">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-700">
                      קבצים חדשים
                    </span>
                  </div>
                )}

                {/* Delete Button */}
                <div className="absolute top-1 left-1 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHospital(h.name);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <CardContent
                  className="p-6 flex items-start gap-4 cursor-pointer mt-2"
                  onClick={() => {
                    setSelectedHospital(h);
                    setRunsLevel("months");
                  }}
                >
                  <div className="h-14 w-14 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shrink-0">
                    <HospitalIcon size={35} />
                  </div>
                  <div className="flex-1 min-w-0 ">
                    <h3 className="pt-3 font-bold text-xl text-slate-800 truncate text-right">
                      {h.name}
                    </h3>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className="font-mono bg-white text-slate-500 border-slate-200"
                      >
                        Code: {h.code}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isModalOpen && modalType === "hospital" && (
          <Modal
            title="הוספת בית חולים חדש"
            onSave={handleCreateHospital}
            onClose={() => {
              setIsModalOpen(false);
              setNewHospital({ name: "", code: "" });
              setIsCustomHospital(false);
            }}
            isValid={
              newHospital.name.length > 2 && newHospital.code.length >= 2
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  בחר בית חולים מהרשימה או הזן חדש
                </label>
                <Select
                  value={newHospital.name && newHospital.code ? `${newHospital.name}|${newHospital.code}` : ""}
                  onChange={(value) => {
                    if (value === "custom") {
                      setIsCustomHospital(true);
                      setNewHospital({ name: "", code: "" });
                    } else if (value === "") {
                      setIsCustomHospital(false);
                      setNewHospital({ name: "", code: "" });
                    } else {
                      setIsCustomHospital(false);
                      const [name, code] = value.split("|");
                      setNewHospital({ name, code });
                    }
                  }}
                  options={[
                    ...PREDEFINED_HOSPITALS.map((h) => ({
                      value: `${h.name}|${h.code}`,
                      label: `${h.name} (${h.code})`,
                    })),
                    { value: "custom", label: "+ הזן בית חולים מותאם אישית" },
                  ]}
                  placeholder="בחר מהרשימה"
                />
              </div>
              {isCustomHospital && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      שם בית החולים
                    </label>
                    <Input
                      value={newHospital.name}
                      onChange={(e) =>
                        setNewHospital({ ...newHospital, name: e.target.value })
                      }
                      placeholder="לדוגמה: מרכז רפואי רבין"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      קוד בית חולים (פנימי)
                    </label>
                    <Input
                      value={newHospital.code}
                      onChange={(e) =>
                        setNewHospital({
                          ...newHospital,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="לדוגמה: RBN"
                      className="font-mono uppercase"
                      maxLength={4}
                    />
                  </div>
                </>
              )}
            </div>
          </Modal>
        )}

        {isModalOpen && modalType === "monthWithHospitalSelect" && (
          <Modal
            title="יצירת תיקיית חודש חדש"
            onSave={handleCreateMonth}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedHospitalForMonth("");
              setNewMonth({ month: "" });
            }}
            isValid={
              selectedHospitalForMonth !== "" &&
              selectedHospitalForMonth !== "new" &&
              isValidMonthYear(newMonth.month)
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  בחר בית חולים
                </label>
                <Select
                  value={selectedHospitalForMonth}
                  onChange={(value) => {
                    if (value === "new") {
                      // Close this modal and open hospital creation modal
                      setIsModalOpen(false);
                      setSelectedHospitalForMonth("");
                      setTimeout(() => {
                        setModalType("hospital");
                        setIsModalOpen(true);
                      }, 100);
                    } else {
                      setSelectedHospitalForMonth(value);
                    }
                  }}
                  options={[
                    ...hospitals.map((h) => ({
                      value: h.name,
                      label: `${h.name} (${h.code})`,
                    })),
                    { value: "new", label: "+ צור בית חולים חדש" },
                  ]}
                  placeholder="בחר בית חולים מהרשימה"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  חודש ושנה
                </label>
                <Input
                  value={newMonth.month}
                  onChange={(e) =>
                    setNewMonth({ ...newMonth, month: e.target.value })
                  }
                  placeholder="MM/YYYY"
                  className={`font-mono ${
                    newMonth.month && !isValidMonthYear(newMonth.month)
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {newMonth.month && !isValidMonthYear(newMonth.month) && (
                  <p className="text-xs text-red-600 mt-1">
                    פורמט לא תקין. יש להזין MM/YYYY (לדוגמה: 02/2026)
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  המערכת תיצור תיקייה חדשה ותאפשר העלאת קבצים עבור חודש זה.
                </p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (runsLevel === "months" && selectedHospital) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-right flex flex-col items-start">
            <Button
              variant="ghost"
              className="gap-2 text-slate-500 hover:text-slate-800 p-0 mb-2 h-auto hover:bg-transparent justify-start"
              onClick={() => setRunsLevel("hospitals")}
            >
              <ArrowRight size={16} /> חזרה לרשימת בתי חולים
            </Button>
            <h1 className="text-2xl font-bold flex items-center justify-start gap-3 text-slate-900">
              <Folder size={28} className="text-slate-400" />
              {selectedHospital.name}{" "}
              <span className="text-slate-300 font-light text-2xl">|</span>{" "}
              ניהול חודשים
            </h1>
            <p className="text-slate-500 mt-1">
              בחר חודש לניהול קבצים והרצות או צור תיקייה חדשה
            </p>
          </div>
          <div className="pt-6 flex flex-col items-start gap-4">
            <Button
              className="gap-2 shadow-sm"
              onClick={() => {
                setModalType("month");
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> יצירת תיקיית חודש חדש
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-800">שגיאה</h4>
                <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800 hover:bg-red-100"
              >
                סגור
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoadingMonths && (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={40} className="animate-spin text-blue-600" />
          </div>
        )}

        {/* Months Table */}
        {!isLoadingMonths && (
          <div className="border rounded-xl bg-white overflow-hidden shadow-sm border-slate-200">
            <Table>
              <TableHeader className="bg-slate-50 text-slate-500">
                <TableRow>
                  <TableHead className="font-medium py-4 text-right">
                    שם התיקייה (חודש)
                  </TableHead>
                  <TableHead className="font-medium py-4 text-right">
                    סטטוס אחרון
                  </TableHead>
                  <TableHead className="font-medium py-4 text-right">
                    עודכן לאחרונה
                  </TableHead>
                  <TableHead className="font-medium py-4 text-center">
                    פעולות
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((m) => (
                  <TableRow
                    key={m.period}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="font-bold py-6 cursor-pointer" onClick={() => handleSelectMonth(m)}>
                      <div className="flex items-center gap-3">
                        <FolderOpen size={20} className="text-blue-600" />
                        <span className="text-lg text-slate-700">{m.period}</span>
                      </div>
                    </TableCell>
                    <TableCell className="cursor-pointer" onClick={() => handleSelectMonth(m)}>
                      <div className="flex items-center gap-3">
                        {m.hasPendingUploads ? (
                          <Badge
                            variant="warning"
                            className="shadow-sm border-amber-200 bg-amber-50 text-amber-700 font-medium px-2.5 py-1"
                          >
                            ממתין להרצה
                          </Badge>
                        ) : (
                          <StatusBadge status={m.status} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm cursor-pointer" onClick={() => handleSelectMonth(m)}>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="font-mono">
                          {m.lastRunTimestamp || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100 font-medium px-4 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectMonth(m);
                          }}
                        >
                          ניהול קבצים והרצה
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMonth(m.period);
                          }}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {isModalOpen && modalType === "month" && (
          <Modal
            title="פתיחת חודש חדש"
            onSave={handleCreateMonth}
            onClose={() => setIsModalOpen(false)}
            isValid={isValidMonthYear(newMonth.month)}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  חודש ושנה  
                </label>
                <Input
                  value={newMonth.month}
                  onChange={(e) =>
                    setNewMonth({ ...newMonth, month: e.target.value })
                  }
                  placeholder="MM/YYYY"
                  className={`font-mono ${
                    newMonth.month && !isValidMonthYear(newMonth.month)
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {newMonth.month && !isValidMonthYear(newMonth.month) && (
                  <p className="text-xs text-red-600 mt-1">
                    פורמט לא תקין. יש להזין MM/YYYY (לדוגמה: 02/2026)
                  </p>
                )}{" "}
                <p className="text-xs text-slate-500 mt-1">
                  המערכת תיצור תיקייה חדשה ותאפשר העלאת קבצים עבור חודש זה.
                </p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (runsLevel === "details" && selectedHospital && selectedMonth) {
    // Determine display status and button state logic
    const isRunning = selectedMonth.status === RunStatus.InProgress;
    const hasPending = selectedMonth.hasPendingUploads;

    let displayStatus: RunStatus | string = selectedMonth.status;
    if (isRunning) displayStatus = RunStatus.InProgress;
    else if (hasPending) displayStatus = "ממתין להרצה";

    // File categories for the UI
    const fileCategories = [
      {
        id: "hospitalization",
        name: "אשפוז",
      },
      {
        id: "ambulatory",
        name: "אמבולטורי",
      },
      {
        id: "er",
        name: "מיון",
      },
    ];

    return (
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Top Navigation */}
        <div className="flex justify-between items-start">
          {/* Navigation Right */}
          <div className="flex flex-col items-end">
            <Button
              variant="ghost"
              className="gap-2 text-slate-500 hover:text-slate-800 p-0 mb-2 h-auto hover:bg-transparent"
              onClick={() => setRunsLevel("months")}
            >
             <ArrowRight  size={16} />
             חזרה לרשימת חודשים 
            </Button>
          </div>
        </div>

        {/* Main Control Header */}
        <Card className="border-slate-200 shadow-sm">
          <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                  {selectedMonth.period}{" "}
                  <span className="text-slate-300 font-light">/</span>{" "}
                  {selectedHospital.name}
                </h1>
                {/* Use custom badge for pending state logic if needed, or rely on StatusBadge logic */}
                {displayStatus === "ממתין להרצה" ? (
                  <Badge
                    variant="warning"
                    className="shadow-sm border-amber-200 bg-amber-50 text-amber-700 font-medium px-2.5 py-1"
                  >
                    ממתין להרצה
                  </Badge>
                ) : (
                  <StatusBadge status={displayStatus} />
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">
                  עודכן לאחרונה: {selectedMonth.lastRunTimestamp || "-"}
                </span>
                {hasPending && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded border border-amber-200 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> קבצים חדשים ממתינים להרצה
                  </span>
                )}
              </div>
            </div>

            <Button
              className={`gap-2 min-w-[140px] ${isRunning ? "cursor-not-allowed opacity-80" : ""}`}
              disabled={isRunning}
              variant={isRunning ? "secondary" : "default"}
              onClick={handleRunUpload}
            >
              {isRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  ריצה בתהליך...
                </>
              ) : (
                <>
                  <Play size={16} />
                  הפעל הרצה
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Upload Status Messages */}
        {uploadSuccess && (
          <Card className="border-green-200 bg-green-50 shadow-sm">
            <div className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-800">הקבצים הועלו בהצלחה!</h4>
                <p className="text-sm text-green-700 mt-0.5">
                  כל הקבצים הועלו לענן בהצלחה. ההרצה תתחיל בקרוב.
                </p>
              </div>
            </div>
          </Card>
        )}

        {uploadError && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-800">שגיאה בהעלאת קבצים</h4>
                <p className="text-sm text-red-700 mt-0.5">{uploadError}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadError(null)}
                className="text-red-600 hover:text-red-800 hover:bg-red-100"
              >
                סגור
              </Button>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <div className="p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-red-800">שגיאה</h4>
                <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800 hover:bg-red-100"
              >
                סגור
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State for Files */}
        {isLoadingFiles && (
          <div className="flex justify-center items-center py-12">
            <Loader2 size={40} className="animate-spin text-blue-600" />
          </div>
        )}

        {/* File Categories */}
        <div>
          <div className="flex items-center gap-2 mb-4 text-slate-500 font-medium px-1">
            <FolderOpen size={20} />
            <h3>קבצי מקור (Data Sources)</h3>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start transition-opacity duration-300 ${isRunning ? "opacity-60 pointer-events-none" : ""}`}
          >
            {fileCategories.map((cat) => (
              <Card
                key={cat.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                  <Badge
                    variant="success"
                    className="bg-emerald-50 text-emerald-700 border-emerald-100 font-normal"
                  >
                    {((existingFiles?.[cat.id as keyof FilesByTypeResponse]?.length || 0) + (uploadedFiles[cat.id]?.length || 0))} קבצים
                  </Badge>
                  <h3 className="font-bold text-lg text-slate-800">
                    {cat.name}
                  </h3>
                </div>

                <div className="p-4 flex flex-col gap-4">
                  {/* Existing Files from Blob Storage */}
                  {existingFiles && existingFiles[cat.id as keyof FilesByTypeResponse]?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        קבצים קיימים
                      </h4>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {existingFiles[cat.id as keyof FilesByTypeResponse].map((file, idx) => {
                          const fileType = getFileTypeCategory(file.name);
                          const iconColor =
                            fileType === "pdf"
                              ? "bg-rose-50 text-rose-600"
                              : fileType === "txt"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-purple-50 text-purple-600";

                          return (
                            <div
                              key={idx}
                              className="group flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                  <div
                                    className={`p-2 rounded-lg shrink-0 ${iconColor}`}
                                  >
                                    <FileText size={16} />
                                  </div>
                                  <div className="flex flex-col overflow-hidden flex-1">
                                    <span className="text-sm text-slate-700 truncate font-medium dir-ltr text-right">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex mr-2 items-center gap-1 shrink-0">
                                  {/* <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                                    onClick={() => window.open(file.url, '_blank')}
                                    title="הורד קובץ"
                                  >
                                    <Download size={14} />
                                  </Button> */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 left-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExistingFile(cat.id, file.name);
                                    }}
                                    disabled={isRunning || isUploading}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* File Upload Zone */}
                  <div>
                    {existingFiles && existingFiles[cat.id as keyof FilesByTypeResponse]?.length > 0 && (
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        העלאת קבצים חדשים
                      </h4>
                    )}
                    <FileUploadZone
                      onFilesSelected={(files) =>
                        handleFilesSelected(cat.id, files)
                      }
                      acceptedTypes={[".pdf", ".txt", ".tif", ".tiff"]}
                      maxSizeInMB={10}
                      disabled={isRunning}
                    />
                  </div>

                  {/* Newly Uploaded Files (Not Yet Saved to Blob) */}
                  {uploadedFiles[cat.id]?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        קבצים חדשים להעלאה
                      </h4>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {uploadedFiles[cat.id].map((file, idx) => {
                          const fileType = getFileTypeCategory(file.name);
                          const iconColor =
                            fileType === "pdf"
                              ? "bg-rose-50 text-rose-600"
                              : fileType === "txt"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-purple-50 text-purple-600";

                          const fileProgress =
                            uploadProgress[cat.id]?.[idx];
                          const isFileUploading = isUploading && fileProgress;

                          return (
                            <div
                              key={idx}
                              className="group flex flex-col p-3 bg-white border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                  <div
                                    className={`p-2 rounded-lg shrink-0 ${iconColor}`}
                                  >
                                    <FileText size={16} />
                                  </div>
                                  <div className="flex flex-col overflow-hidden flex-1">
                                    <span className="text-sm text-slate-600 truncate font-medium dir-ltr text-left">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {formatFileSize(file.size)}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileDelete(cat.id, idx);
                                  }}
                                  disabled={isRunning || isUploading}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>

                              {/* Upload Progress Bar */}
                              {isFileUploading && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-blue-600 font-medium">
                                      מעלה...
                                    </span>
                                    <span className="text-slate-500">
                                      {fileProgress.percentage}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${fileProgress.percentage}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
