
import { useState, useEffect } from 'react';
import { getRules, addRule, updateRuleStatus } from '@/services/dataStore';
import type { Rule } from '@/types';
import { Plus, Edit, RefreshCw, Users, Search, Filter, CheckCircle, XCircle, BadgeCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/Modal';

export const AdminRules: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleTab, setRuleTab] = useState<string>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<{text: string, domain: string, action: 'approve' | 'reject' | 'review'}>({ text: '', domain: 'אשפוז', action: 'review' });

  useEffect(() => {
    setRules(getRules());
  }, [isModalOpen]);

  const handleCreateRule = () => {
      addRule({ 
          ...newRule, 
          status: 'suggestion', 
          createdBy: 'אדמין', 
          validity: [{ from: new Date().toLocaleDateString('en-GB') }] 
      });
      setIsModalOpen(false);
      setNewRule({ text: '', domain: 'אשפוז', action: 'review' });
  };

  const getFilteredRules = (status: string) => {
      if (status === 'archive') return rules.filter(r => r.status === 'archived' || r.status === 'rejected');
      return rules.filter(r => r.status === status);
  };

  const getActionBadge = (action: string) => {
    switch(action) {
        case 'approve': return <Badge variant="success" className="gap-1"><BadgeCheck size={12}/> אישור אוטומטי</Badge>;
        case 'reject': return <Badge variant="destructive" className="gap-1"><XCircle size={12}/> דחייה</Badge>;
        case 'review': return <Badge variant="warning" className="gap-1"><ShieldAlert size={12}/> דורש בדיקה</Badge>;
        default: return null;
    }
  };

  return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
              <div>
                  <h1 className="text-2xl font-bold tracking-tight">ניהול חוקים עסקיים</h1>
                  <p className="text-slate-500">הגדרת לוגיקה עסקית לבקרה אוטומטית</p>
              </div>
              <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
                  <Plus size={16} /> חוק חדש
              </Button>
          </div>

          <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="חיפוש חוקים..." className="pr-9" />
              </div>
              <Button variant="outline" className="gap-2"><Filter size={16}/> סינון מתקדם</Button>
          </div>

          <Tabs value={ruleTab} onValueChange={setRuleTab} className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 rounded-none h-auto p-0 mb-6">
                  <TabsTrigger 
                      value="active" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-2 font-medium"
                  >
                      חוקים פעילים
                  </TabsTrigger>
                  <TabsTrigger 
                      value="suggestion" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-2 font-medium"
                  >
                      חוקים לאישור
                  </TabsTrigger>
                  <TabsTrigger 
                      value="archive" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-2 font-medium"
                  >
                      ארכיון חוקים
                  </TabsTrigger>
              </TabsList>
              
              {['active', 'suggestion', 'archive'].map((tabValue) => (
                  <TabsContent key={tabValue} value={tabValue} className="mt-0">
                      <div className="grid grid-cols-1 gap-4">
                          {getFilteredRules(tabValue).length === 0 ? (
                              <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                  לא נמצאו חוקים בקטגוריה זו
                              </div>
                          ) : (
                              getFilteredRules(tabValue).map(rule => (
                                  <Card key={rule.id} className="group hover:border-blue-400 transition-colors">
                                      <CardContent className="p-6">
                                          <div className="flex justify-between items-start gap-4">
                                              <div className="flex-1">
                                                  <div className="flex items-center gap-3 mb-2">
                                                      <Badge variant="outline" className="font-mono bg-slate-50">{rule.id}</Badge>
                                                      <Badge variant={rule.domain === 'אשפוז' ? 'default' : 'secondary'} className="rounded-sm">{rule.domain}</Badge>
                                                      {getActionBadge(rule.action)}
                                                  </div>
                                                  <p className="text-lg font-medium text-slate-900 leading-relaxed">
                                                      "{rule.text}"
                                                  </p>
                                                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                                                      <span className="flex items-center gap-1"><Users size={12}/> נוצר ע"י: {rule.createdBy}</span>
                                                      <span className="flex items-center gap-1"><RefreshCw size={12}/> בתוקף מ: {rule.validity[0].from}</span>
                                                  </div>
                                              </div>
                                              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Button size="icon" variant="ghost" className="h-8 w-8"><Edit size={16}/></Button>
                                                  {rule.status === 'active' ? (
                                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => { updateRuleStatus(rule.id, 'archived'); setRules(getRules()); }}><XCircle size={16}/></Button>
                                                  ) : rule.status === 'suggestion' ? (
                                                       <div className="flex gap-1">
                                                           <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 bg-emerald-50 hover:bg-emerald-100" onClick={() => { updateRuleStatus(rule.id, 'active'); setRules(getRules()); }} title="אשר חוק"><CheckCircle size={16}/></Button>
                                                           <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { updateRuleStatus(rule.id, 'rejected'); setRules(getRules()); }} title="דחה"><XCircle size={16}/></Button>
                                                       </div>
                                                  ) : null}
                                              </div>
                                          </div>
                                      </CardContent>
                                  </Card>
                              ))
                          )}
                      </div>
                  </TabsContent>
              ))}
          </Tabs>

          {isModalOpen && (
           <Modal 
            title="הגדרת חוק עסקי חדש" 
            onSave={handleCreateRule} 
            onClose={() => setIsModalOpen(false)}
            isValid={newRule.text.length > 5}
           >
               <div className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">תוכן החוק</label>
                       <Textarea 
                            className="min-h-[100px]"
                            value={newRule.text} 
                            onChange={e => setNewRule({...newRule, text: e.target.value})} 
                            placeholder="לדוגמה: אם קוד אבחנה הוא X, חובה לצרף מסמך Y..." 
                        />
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">פעולה נדרשת במידה והחוק מתקיים</label>
                       <div className="grid grid-cols-3 gap-2">
                           {[
                               { id: 'approve', label: 'אישור (עבר)', icon: BadgeCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                               { id: 'reject', label: 'דחייה (נדחה)', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                               { id: 'review', label: 'בדיקה (Review)', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
                           ].map(opt => (
                               <div 
                                  key={opt.id}
                                  onClick={() => setNewRule({...newRule, action: opt.id as any})}
                                  className={`
                                      cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all
                                      ${newRule.action === opt.id ? `${opt.bg} ${opt.border} ring-1 ring-offset-1 ring-slate-400` : 'border-slate-200 hover:bg-slate-50'}
                                  `}
                               >
                                   <opt.icon className={newRule.action === opt.id ? opt.color : 'text-slate-400'} size={24} />
                                   <span className={`text-xs font-bold ${newRule.action === opt.id ? 'text-slate-900' : 'text-slate-500'}`}>{opt.label}</span>
                               </div>
                           ))}
                       </div>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">תחום</label>
                       <select 
                           className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                           value={newRule.domain}
                           onChange={(e) => setNewRule({...newRule, domain: e.target.value})}
                       >
                           <option value="אשפוז">אשפוז</option>
                           <option value="אמבולטורי">אמבולטורי</option>
                           <option value="מיון">מיון</option>
                           <option value="כללי">כללי</option>
                       </select>
                   </div>
               </div>
           </Modal>
       )}
      </div>
  );
};
