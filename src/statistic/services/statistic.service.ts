import { StatisticRepository } from "../repositories/statistic.repository";

type RangeType = "day" | "week" | "month";

export class StatisticService {
  private statisticRepository = new StatisticRepository();
  private static readonly VN_OFFSET_MS = 7 * 60 * 60 * 1000;

  public getRangeTypes() {
    return { rangeTypes: ["day", "week", "month"] as const };
  }

  private startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Convert UTC time to VN "wall clock" time while using UTC getters.
  private toVnWallClock(utc: Date) {
    return new Date(utc.getTime() + StatisticService.VN_OFFSET_MS);
  }

  // Convert VN "wall clock" time back to UTC.
  private fromVnWallClock(vn: Date) {
    return new Date(vn.getTime() - StatisticService.VN_OFFSET_MS);
  }

  private addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + n);
    return x;
  }

  private addMonths(d: Date, n: number) {
    const x = new Date(d);
    x.setUTCMonth(x.getUTCMonth() + n);
    return x;
  }

  private startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private startOfWeek(d: Date) {
    const x = this.startOfDay(d);
    const day = x.getDay(); // 0-6 (Sun=0)
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    x.setDate(x.getDate() + diff);
    return x;
  }

  private vnStartOfDayUtc(utc: Date) {
    const vn = this.toVnWallClock(utc);
    const startVn = new Date(
      Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()),
    );
    return this.fromVnWallClock(startVn);
  }

  private vnStartOfWeekUtc(utc: Date) {
    const vn = this.toVnWallClock(utc);
    const day = vn.getUTCDay(); // 0-6 (Sun=0)
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    const mondayVn = new Date(
      Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + diff),
    );
    return this.fromVnWallClock(mondayVn);
  }

  private vnStartOfMonthUtc(utc: Date) {
    const vn = this.toVnWallClock(utc);
    const startVn = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1));
    return this.fromVnWallClock(startVn);
  }

  private toBucketStart(d: Date, range: RangeType) {
    if (range === "day") return this.startOfDay(d);
    if (range === "week") return this.startOfWeek(d);
    return this.startOfMonth(d);
  }

  private bucketKey(d: Date, range: RangeType) {
    return this.toBucketStart(d, range).toISOString().slice(0, 10);
  }

  private vnBucketKeyFromUtc(utc: Date, range: RangeType) {
    const vn = this.toVnWallClock(utc);
    if (range === "day") {
      return new Date(
        Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()),
      )
        .toISOString()
        .slice(0, 10);
    }
    if (range === "week") {
      const day = vn.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      return new Date(
        Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + diff),
      )
        .toISOString()
        .slice(0, 10);
    }
    return new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
  }

  private labelFromBucketStartUtc(startUtc: Date, range: RangeType) {
    const vn = this.toVnWallClock(startUtc);
    if (range === "month") {
      return `${vn.getUTCMonth() + 1}/${vn.getUTCFullYear()}`;
    }
    return `${vn.getUTCDate()}/${vn.getUTCMonth() + 1}`;
  }

  public async recentPatientsToday(clinicId?: string, limit: number = 5) {
    const { records, newPatients } =
      await this.statisticRepository.recentPatientsToday(clinicId, limit);

    const merged = [
      ...records.map((r) => ({
        patientId: r.patient?.patientId ?? "",
        fullName: r.patient?.fullName ?? "",
        at: r.createdAt ?? null,
      })),
      ...newPatients.map((p) => ({
        patientId: p.patientId,
        fullName: p.fullName ?? "",
        at: p.createdAt ?? null,
      })),
    ];

    const map = new Map<
      string,
      { patientId: string; fullName: string; at: Date | null }
    >();
    for (const item of merged) {
      if (!item.patientId) continue;
      const existing = map.get(item.patientId);
      if (
        !existing ||
        (item.at?.getTime() ?? 0) > (existing.at?.getTime() ?? 0)
      ) {
        map.set(item.patientId, item);
      }
    }

    const deduped = Array.from(map.values());
    deduped.sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));

    return deduped.slice(0, limit);
  }

  public async getDashboard(
    range: RangeType = "day",
    points = 7,
    limit = 5,
    clinicId?: string,
  ) {
    const safeLimit = Number.isFinite(limit) ? Math.max(1, limit) : 5;
    const safePoints = Number.isFinite(points) ? Math.max(1, points) : 7;

    const nowUtc = new Date();
    const todayStart = this.vnStartOfDayUtc(nowUtc);
    const tomorrow = this.addDays(todayStart, 1);

    const weekStart = this.vnStartOfWeekUtc(nowUtc);
    const weekEnd = this.addDays(weekStart, 7);

    const monthStart = this.vnStartOfMonthUtc(nowUtc);
    const monthEnd = this.addMonths(monthStart, 1);

    const [today, week, month] = await Promise.all([
      this.statisticRepository.countRecords(todayStart, tomorrow, clinicId),
      this.statisticRepository.countRecords(weekStart, weekEnd, clinicId),
      this.statisticRepository.countRecords(monthStart, monthEnd, clinicId),
    ]);

    const anchorStartUtc =
      range === "day"
        ? todayStart
        : range === "week"
          ? weekStart
          : monthStart;

    const stepStart = (base: Date, step: number) => {
      if (range === "day") return this.addDays(base, step);
      if (range === "week") return this.addDays(base, step * 7);
      return this.addMonths(base, step);
    };

    const starts: Date[] = [];
    for (let i = safePoints - 1; i >= 0; i--) {
      starts.push(stepStart(anchorStartUtc, -i));
    }

    const chartFrom = starts[0];
    const chartTo = stepStart(anchorStartUtc, 1);
    const rows = await this.statisticRepository.recordsInRange(
      chartFrom,
      chartTo,
      clinicId,
    );

    const buckets = new Map<string, number>();
    for (const r of rows) {
      if (!r.createdAt) continue;
      const key = this.vnBucketKeyFromUtc(r.createdAt, range);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const labels: string[] = [];
    const values: number[] = [];
    for (const start of starts) {
      const key = this.vnBucketKeyFromUtc(start, range);
      labels.push(this.labelFromBucketStartUtc(start, range));
      values.push(buckets.get(key) ?? 0);
    }

    const latest = values[values.length - 1] ?? 0;
    const average =
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;
    const trendPct =
      average === 0 ? 0 : Math.round(((latest - average) / average) * 100);

    const recent = await this.recentPatientsToday(clinicId, safeLimit);

    return {
      counters: { today, week, month },
      chart: { labels, values, latest, average, trendPct, range },
      recentPatients: recent.map((r) => ({
        patientId: r.patientId,
        fullName: r.fullName,
        at: r.at ? r.at.toISOString() : "",
      })),
    };
  }

  public async getPrescriptionRevenueByMedicine(
    range: RangeType = "month",
    points = 4,
    top = 10,
    clinicId?: string,
  ) {
    const safePoints = Number.isFinite(points) ? Math.max(1, points) : 4;
    const safeTop = Number.isFinite(top) ? Math.max(1, top) : 10;

    const nowUtc = new Date();
    const todayStart = this.vnStartOfDayUtc(nowUtc);
    const weekStart = this.vnStartOfWeekUtc(nowUtc);
    const monthStart = this.vnStartOfMonthUtc(nowUtc);

    const anchorStartUtc =
      range === "day"
        ? todayStart
        : range === "week"
          ? weekStart
          : monthStart;

    const stepStart = (base: Date, step: number) => {
      if (range === "day") return this.addDays(base, step);
      if (range === "week") return this.addDays(base, step * 7);
      return this.addMonths(base, step);
    };

    const starts: Date[] = [];
    for (let i = safePoints - 1; i >= 0; i--) {
      starts.push(stepStart(anchorStartUtc, -i));
    }

    const chartFrom = starts[0];
    const chartTo = stepStart(anchorStartUtc, 1);
    const prescriptions =
      await this.statisticRepository.findDispensedPrescriptionsInRange(
        chartFrom,
        chartTo,
        clinicId,
      );

    const revenueByBucket = new Map<string, number>();
    const byMedicine = new Map<
      string,
      { medicineId: string; medicineName: string; revenue: number; quantity: number }
    >();

    for (const p of prescriptions) {
      if (!p.dispensedAt) continue;
      const bucketKey = this.vnBucketKeyFromUtc(p.dispensedAt, range);

      let prescriptionRevenue = 0;
      for (const d of p.details ?? []) {
        const lineRevenue = d.totalPrice
          ? Number(d.totalPrice)
          : d.appliedExportPrice && d.quantity
            ? Number(d.appliedExportPrice) * Number(d.quantity)
            : 0;
        prescriptionRevenue += lineRevenue;

        const medicineId = d.medicine?.medicineId;
        if (!medicineId) continue;
        const medicineName = d.medicine?.medicineName ?? "Khac";
        const quantity = d.quantity ? Number(d.quantity) : 0;

        const existing = byMedicine.get(medicineId);
        if (!existing) {
          byMedicine.set(medicineId, {
            medicineId,
            medicineName,
            revenue: lineRevenue,
            quantity,
          });
        } else {
          existing.revenue += lineRevenue;
          existing.quantity += quantity;
        }
      }

      revenueByBucket.set(
        bucketKey,
        (revenueByBucket.get(bucketKey) ?? 0) + prescriptionRevenue,
      );
    }

    const labels: string[] = [];
    const values: number[] = [];
    for (const start of starts) {
      const key = this.vnBucketKeyFromUtc(start, range);
      labels.push(this.labelFromBucketStartUtc(start, range));
      values.push(revenueByBucket.get(key) ?? 0);
    }

    const latest = values[values.length - 1] ?? 0;
    const average =
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0;
    const trendPct =
      average === 0 ? 0 : Math.round(((latest - average) / average) * 100);

    const totalRevenue = Array.from(byMedicine.values()).reduce(
      (sum, item) => sum + item.revenue,
      0,
    );

    const breakdown = Array.from(byMedicine.values())
      .map((item) => ({
        ...item,
        pct:
          totalRevenue === 0
            ? 0
            : Math.round((item.revenue / totalRevenue) * 100),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, safeTop);

    return {
      summary: {
        totalRevenue,
        totalMedicines: byMedicine.size,
      },
      chart: { range, labels, values, latest, average, trendPct },
      breakdown,
    };
  }
}
