import React, { useState } from 'react';
import { X, ShieldCheck, FileText, ExternalLink, Check } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'impressum' | 'datenschutz';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'impressum'
}) => {
  const [activeTab, setActiveTab] = useState<'impressum' | 'datenschutz'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header with Tab switcher */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('impressum')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'impressum'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Impressum</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('datenschutz')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'datenschutz'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Datenschutzerklärung</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed">
          {activeTab === 'impressum' ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Impressum</h3>
                <p className="text-xs text-slate-500">Angaben gemäß § 5 TMG</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-900 text-base">Narrenkreis Bruchsal</div>
                <div className="text-slate-600">Interessensgemeinschaft in Sachen Fasnacht</div>
                <div className="text-slate-600">76646 Bruchsal</div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Vertreten durch:</h4>
                <p className="font-semibold text-slate-900">Lars Dettweiler</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Kontakt:</h4>
                <div className="space-y-0.5">
                  <p>Telefon: <a href="tel:+491755212337" className="text-sky-700 hover:underline font-mono">+49 175 5212337</a></p>
                  <p>E-Mail: <a href="mailto:Larsdettweiler@web.de" className="text-sky-700 hover:underline font-mono">Larsdettweiler@web.de</a></p>
                  <p>Website: <span className="font-mono text-slate-800">narrenkreis-bruchsal.de</span></p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:</h4>
                <p className="font-semibold text-slate-900">Martin Kuntzsch</p>
                <p className="text-slate-600">St.Leoner Straße 25</p>
                <p className="text-slate-600">68753 Waghäusel</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Streitschlichtung</h4>
                <p className="text-xs text-slate-600 leading-normal">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                  <a 
                    href="https://ec.europa.eu/consumers/odr" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sky-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>https://ec.europa.eu/consumers/odr</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>.
                </p>
                <p className="text-xs text-slate-600 leading-normal">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Datenschutzerklärung</h3>
                <p className="text-xs text-slate-500">Informationen zur Verarbeitung personenbezogener Daten</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900">1. Datenschutz auf einen Blick</h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Allgemeine Hinweise</p>
                  <p>
                    Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                  </p>
                  <p className="font-semibold text-slate-800 pt-1">Verantwortlicher für die Datenerfassung</p>
                  <p>
                    Die Datenverarbeitung auf dieser Website erfolgt durch den Webseitenbetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">2. Allgemeine Hinweise und Pflichtinformationen</h4>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Datenschutz</p>
                  <p>
                    Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung. Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
                  </p>
                  <p className="font-semibold text-slate-800 pt-1">SSL- bzw. TLS-Verschlüsselung</p>
                  <p>
                    Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
                  </p>
                  <p className="font-semibold text-slate-800 pt-1">Recht auf Auskunft, Löschung und Berichtigung</p>
                  <p>
                    Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit an uns wenden.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">3. Datenerfassung auf unserer Website</h4>
                <div className="space-y-2.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Hosting</p>
                  <p>
                    Wir hosten unsere Website bei Google Firebase. Der Anbieter speichert die Daten auf seinen Servern. Wir haben einen Vertrag über Auftragsverarbeitung (AVV) mit dem oben genannten Anbieter geschlossen.
                  </p>
                  <p className="font-semibold text-slate-800 pt-1">Server-Log-Dateien</p>
                  <p>
                    Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 pl-2 text-slate-700">
                    <li>Browsertyp und Browserversion</li>
                    <li>verwendetes Betriebssystem</li>
                    <li>Referrer URL</li>
                    <li>Hostname des zugreifenden Rechners</li>
                    <li>Uhrzeit der Serveranfrage</li>
                    <li>IP-Adresse</li>
                  </ul>
                  <p>
                    Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Webseitenbetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
                  </p>
                  <p className="font-semibold text-slate-800 pt-1">Anfragen per E-Mail oder Telefon</p>
                  <p>
                    Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">Narrenkreis Bruchsal · designed by Martin Kuntzsch</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
