import StatCard from './StatCard';
import ContentCard from './ContentCard';
import NewsRotator from './NewsRotator';
import { I } from '../../../icons';
import FeatureStrip from './FeatureStrip';
import AboutPanel from './AboutPanel';
import CasesTable from './CasesTable';
import TrackRecord from './TrackRecord';
import PracticeAreas from './PracticeAreas';
import Schedule from './LinksInteres';
import ContactStrip from './ContactStrip';

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3.5">
        <ContentCard label="De Interes" icon={I.news} variant="yellow">
          <NewsRotator />
        </ContentCard>
        <StatCard
          icon={I.packageOpen}
          variant="blue"
          columns={[
            { label: 'Documentos Totales', value: '+145.000', change: { up: true,  text: '+345 este mes' } },
            { label: 'Temas (subtemas)', value: '1.200 (3.640)',    change: { up: true,  text: '+18 este mes'  } },
            { label: 'Entidades Públicas',  value: '74',  change: { up: true, text: '+4 este mes'   } },
          ]}
        />
      </div>

      <FeatureStrip />
      <Schedule />

      <AboutPanel />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        <CasesTable />
        <div className="flex flex-col gap-5">
          <TrackRecord />
          <PracticeAreas />
        </div>
      </div>

      <ContactStrip />
    </div>
  );
}
