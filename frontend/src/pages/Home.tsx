import React, { useEffect, useState } from 'react';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAuth } from '../contexts/AuthContext';
import { getNormalizedRole } from '../utils/user';
import { farmsApi } from '../api/farmsApi';
import { recordsApi } from '../api/recordsApi';
import { healthApi, HealthResponse } from '../api/healthApi';
import { Farm } from '../types/farm';
import { AgriculturalRecord } from '../types/record';
import { FarmerDashboard } from '../components/dashboards/FarmerDashboard';
import { OfficerDashboard } from '../components/dashboards/OfficerDashboard';
import { TransportDashboard } from '../components/dashboards/TransportDashboard';

export function Home() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [records, setRecords] = useState<AgriculturalRecord[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [, setLoading] = useState(true);

  const role = getNormalizedRole(user?.role);

  useEffect(() => {
    Promise.all([
      farmsApi.getFarms().catch(() => []),
      recordsApi.getRecords().catch(() => []),
      healthApi.getHealth().catch(() => null)
    ])
      .then(([fList, rList, hData]) => {
        setFarms(Array.isArray(fList) ? fList : []);
        setRecords(Array.isArray(rList) ? rList : []);
        setHealth(hData);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenLayout wide>
      <div className="px-4 pb-12">
        {role === 'AGRICULTURAL_OFFICER' ? (
          <OfficerDashboard user={user} farms={farms} records={records} health={health} />
        ) : role === 'TRANSPORT_OPERATOR' ? (
          <TransportDashboard user={user} health={health} />
        ) : (
          <FarmerDashboard user={user} farms={farms} records={records} health={health} />
        )}
      </div>
    </ScreenLayout>
  );
}