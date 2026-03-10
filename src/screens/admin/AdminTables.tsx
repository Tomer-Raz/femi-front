
import { useState, useEffect } from 'react';
import { getReferenceTables } from '@/services/dataStore';
import type { ReferenceTable } from '@/types';
import { Upload, ArrowRight, Database, Calendar, Search, FileSpreadsheet, ChevronLeft, Clock, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Modal } from '@/components/ui/Modal';
import { FileUploadZone } from '@/components/FileUploadZone';
import { formatFileSize } from '@/lib/fileUtils';
import { uploadReferenceTable } from '@/service/api';
import type { UploadProgress } from '@/service/types';
import { ApiError } from '@/service/types';

const getTableMockData = (_tableId: string) => {
    // Mock data for the table details view
    return {
          columns: ['קוד', 'תיאור שירות', 'מחיר (₪)', 'תאריך עדכון', 'קטגוריה'],
          rows: [
            ['99281', 'ביקור חדר מיון - רמה 1', '850', '01/01/2025', 'מיון'],
            ['99282', 'ביקור חדר מיון - רמה 2', '1,200', '01/01/2025', 'מיון'],
            ['99283', 'ביקור חדר מיון - רמה 3', '1,850', '01/01/2025', 'מיון'],
            ['99284', 'ביקור חדר מיון - רמה 4', '2,400', '01/01/2025', 'מיון'],
            ['99285', 'ביקור חדר מיון - רמה 5', '3,100', '01/01/2025', 'מיון'],
            ['99291', 'טיפול נמרץ - יום ראשון', '5,500', '01/01/2025', 'טיפול נמרץ'],
            ['99292', 'טיפול נמרץ - ימים נוספים', '3,200', '01/01/2025', 'טיפול נמרץ'],
          ]
    };
  };

export const AdminTables: React.FC = () => {
  const [tables, setTables] = useState<ReferenceTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<ReferenceTable | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    setTables(getReferenceTables());
  }, []);

  const handleUploadVersion = async () => {
      if (!uploadedFile || !selectedTable) return;

      // Reset states
      setUploadError(null);
      setUploadSuccess(false);
      setIsUploading(true);
      setUploadProgress(null);

      try {
        // Upload file with progress tracking
        await uploadReferenceTable(
          selectedTable.id,
          effectiveDate,
          uploadedFile,
          (progress) => {
            setUploadProgress(progress);
          }
        );

        // Success
        setUploadSuccess(true);

        // Close modal after a short delay to show success message
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setEffectiveDate('');
          setUploadedFile(null);
          setUploadProgress(null);
          setUploadSuccess(false);
          setIsUploading(false);
        }, 2000);

      } catch (error) {
        setIsUploading(false);
        if (error instanceof ApiError) {
          setUploadError(error.message);
        } else {
          setUploadError('שגיאה בלתי צפויה בעת העלאת הקובץ');
        }
      }
  };

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setUploadedFile(files[0]); // Take only the first file
    }
  };

  const handleFileDelete = () => {
    setUploadedFile(null);
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setEffectiveDate('');
    setUploadedFile(null);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(null);
    setIsUploading(false);
  };

  const filteredTables = tables.filter(t => t.name.includes(searchTerm));

  if (selectedTable) {
      const mockData = getTableMockData(selectedTable.id);
      return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900 px-0 hover:bg-transparent" onClick={() => setSelectedTable(null)}>
                    <ArrowRight size={20} /> חזרה לרשימה
                </Button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div className="flex gap-4">
                        <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{selectedTable.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1.5"><Calendar size={14}/> בתוקף מ: <span className="font-medium text-slate-700">{selectedTable.effectiveFrom}</span></span>
                                <span className="flex items-center gap-1.5"><Clock size={14}/> עודכן לאחרונה: <span className="font-medium text-slate-700">{selectedTable.lastUpdated}</span></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="חיפוש רשומות..." className="pr-9 w-64 bg-white" />
                        </div>
                        <Button className="gap-2 shadow-sm" onClick={() => setIsUploadModalOpen(true)}>
                            <Upload size={16}/> טעינת גרסה חדשה
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow>
                                {mockData.columns.map((col, idx) => (
                                    <TableHead key={idx} className="font-bold text-slate-700 h-12">{col}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockData.rows.map((row, rIdx) => (
                                <TableRow key={rIdx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-0">
                                    {row.map((cell, cIdx) => (
                                        <TableCell key={cIdx} className="py-3 font-medium text-slate-600">{cell}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 text-center">
                    מציג {mockData.rows.length} רשומות מתוך {mockData.rows.length}
                </div>
            </div>

            {isUploadModalOpen && (
                <Modal
                    title={`טעינת גרסה חדשה - ${selectedTable.name}`}
                    onSave={handleUploadVersion}
                    onClose={handleCloseModal}
                    saveLabel={isUploading ? "מעלה..." : "טען ועדכן"}
                    isValid={!!effectiveDate && !!uploadedFile && !isUploading}
                >
                    <div className="space-y-6">
                        <FileUploadZone
                          onFilesSelected={handleFileSelected}
                          acceptedTypes={['.csv', '.xlsx', '.xls']}
                          maxSizeInMB={25}
                          disabled={isUploading}
                        />

                        {uploadedFile && (
                          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <div className="p-2 rounded-lg shrink-0 bg-green-50 text-green-600">
                                  <FileSpreadsheet size={16} />
                                </div>
                                <div className="flex flex-col overflow-hidden flex-1">
                                  <span className="text-sm text-slate-700 truncate font-medium">
                                    {uploadedFile.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatFileSize(uploadedFile.size)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                                onClick={handleFileDelete}
                                disabled={isUploading}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        )}

                        {uploadProgress && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 font-medium">מעלה קובץ...</span>
                              <span className="text-slate-500">{uploadProgress.percentage}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress.percentage}%` }}
                              />
                            </div>
                            <div className="text-xs text-slate-500 text-center">
                              {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
                            </div>
                          </div>
                        )}

                        {uploadSuccess && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle size={18} className="text-green-600 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800">הקובץ הועלה בהצלחה!</p>
                              <p className="text-xs text-green-600 mt-0.5">הטבלה תתעדכן בקרוב</p>
                            </div>
                          </div>
                        )}

                        {uploadError && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle size={18} className="text-red-600 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-800">שגיאה בהעלאת הקובץ</p>
                              <p className="text-xs text-red-600 mt-0.5">{uploadError}</p>
                            </div>
                          </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">תאריך תוקף לגרסה החדשה</label>
                            <p className="text-xs text-slate-500 mb-2">הגדר ממתי הטבלה החדשה תיכנס לתוקף במערכת</p>
                            <div className="relative">
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                <Input
                                    type="date"
                                    className="pr-9"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
      );
  }

  return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
              <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">טבלאות ייחוס ומחירונים</h1>
                  <p className="text-slate-500 mt-2 text-lg">ניהול קבצי תשתית, מחירוני משרד הבריאות והסכמים</p>
              </div>
               <div className="relative w-72">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="חיפוש טבלה..." 
                    className="pr-9 bg-white shadow-sm" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTables.map(table => (
                  <div 
                    key={table.id} 
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden"
                    onClick={() => setSelectedTable(table)}
                  >
                      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                              <Database size={24} />
                          </div>
                          <Badge variant="outline" className="bg-slate-50 font-mono text-xs text-slate-400">ID: {table.id}</Badge>
                      </div>
                      
                      <h3 className="font-bold text-xl text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">{table.name}</h3>
                      
                      <div className="mt-auto pt-4 space-y-3">
                          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                              <span className="text-slate-500 flex items-center gap-2"><Clock size={14}/> עודכן לאחרונה</span>
                              <span className="font-medium text-slate-700">{table.lastUpdated}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 flex items-center gap-2"><Calendar size={14}/> בתוקף מ</span>
                              <span className="font-medium text-slate-700">{table.effectiveFrom}</span>
                          </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                           <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                               צפה בנתונים <ChevronLeft size={16} />
                           </span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );
};
