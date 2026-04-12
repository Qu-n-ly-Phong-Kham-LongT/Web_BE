import { StatisticRepository } from "../repositories/statistic.repository";

type RangeType = "day" | "week" | "month";
type RevenueView = "day" | "week" | "month";
type MonthView = "week";
type DispensedPrescriptionInRange = Awaited<
  ReturnType<StatisticRepository["findDispensedPrescriptionsInRange"]>
>[number];
type DispensedPrescriptionDetailInRange =
  DispensedPrescriptionInRange["details"][number];

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

  private pad2(n: number) {
    return n.toString().padStart(2, "0");
  }

  private formatVnDateLabelFromUtc(utc: Date) {
    const vn = this.toVnWallClock(utc);
    return `${this.pad2(vn.getUTCDate())}/${this.pad2(vn.getUTCMonth() + 1)}`;
  }

  private parseVnDateInput(dateStr?: string) {
    if (!dateStr) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null;
    }
    const vn = new Date(Date.UTC(year, month - 1, day));
    return this.fromVnWallClock(vn);
  }

  private vnStartOfIsoWeekUtc(year: number, week: number) {
    const safeWeek = Math.max(1, Math.floor(week));
    const jan4Vn = new Date(Date.UTC(year, 0, 4));
    const jan4Day = jan4Vn.getUTCDay();
    const diff = jan4Day === 0 ? -6 : 1 - jan4Day;
    const week1MonVn = new Date(Date.UTC(year, 0, 4 + diff));
    const targetMonVn = new Date(
      Date.UTC(
        week1MonVn.getUTCFullYear(),
        week1MonVn.getUTCMonth(),
        week1MonVn.getUTCDate() + (safeWeek - 1) * 7,
      ),
    );
    return this.fromVnWallClock(targetMonVn);
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

  private getDetailQuantity(detail: DispensedPrescriptionDetailInRange) {
    return detail.quantity ? Number(detail.quantity) : 0;
  }

  private getDetailSellPrice(detail: DispensedPrescriptionDetailInRange) {
    if (detail.appliedExportPrice) {
      return Number(detail.appliedExportPrice);
    }
    if (detail.medicine?.sellPrice) {
      return Number(detail.medicine.sellPrice);
    }
    return 0;
  }

  private getDetailImportPrice(detail: DispensedPrescriptionDetailInRange) {
    if (detail.appliedImportPrice) {
      return Number(detail.appliedImportPrice);
    }
    if (detail.medicine?.importPrice) {
      return Number(detail.medicine.importPrice);
    }
    return 0;
  }

  private buildMedicineProfitSummary(
    prescriptions: DispensedPrescriptionInRange[],
  ) {
    const byMedicine = new Map<
      string,
      {
        medicineId: string;
        medicineName: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();
    const byMedicineType = new Map<
      string,
      {
        typeCode: string;
        typeName: string;
        medicineIds: Set<string>;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    for (const prescription of prescriptions) {
      for (const detail of prescription.details ?? []) {
        const medicineId = detail.medicine?.medicineId;
        if (!medicineId) {
          continue;
        }

        const quantity = this.getDetailQuantity(detail);
        const sellPrice = this.getDetailSellPrice(detail);
        const importPrice = this.getDetailImportPrice(detail);

        const revenue = sellPrice * quantity;
        const cost = importPrice * quantity;
        const profit = revenue - cost;
        const typeCode =
          detail.medicine?.isInsuranceCovered === true ? "BHYT" : "DICH_VU";
        const typeName =
          detail.medicine?.isInsuranceCovered === true ? "BHYT" : "Dịch vụ";
        const existingType = byMedicineType.get(typeCode);
        if (!existingType) {
          byMedicineType.set(typeCode, {
            typeCode,
            typeName,
            medicineIds: new Set([medicineId]),
            quantity,
            revenue,
            cost,
            profit,
          });
        } else {
          existingType.medicineIds.add(medicineId);
          existingType.quantity += quantity;
          existingType.revenue += revenue;
          existingType.cost += cost;
          existingType.profit += profit;
        }

        const medicineName = detail.medicine?.medicineName ?? "Khác";
        const existing = byMedicine.get(medicineId);
        if (!existing) {
          byMedicine.set(medicineId, {
            medicineId,
            medicineName,
            quantity,
            revenue,
            cost,
            profit,
          });
          continue;
        }

        existing.quantity += quantity;
        existing.revenue += revenue;
        existing.cost += cost;
        existing.profit += profit;
      }
    }

    const medicineBreakdown = Array.from(byMedicine.values()).sort(
      (a, b) => b.profit - a.profit,
    );

    const totalProfitMedicine = medicineBreakdown.reduce(
      (sum, item) => sum + item.profit,
      0,
    );

    const medicineTypeBreakdown = Array.from(byMedicineType.values())
      .map((item) => ({
        typeCode: item.typeCode,
        typeName: item.typeName,
        medicineCount: item.medicineIds.size,
        quantity: item.quantity,
        revenue: item.revenue,
        cost: item.cost,
        profit: item.profit,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { medicineBreakdown, medicineTypeBreakdown, totalProfitMedicine };
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

    const [
      todayRecords,
      weekRecords,
      monthRecords,
      todayNewPatients,
      weekNewPatients,
      monthNewPatients,
    ] = await Promise.all([
      this.statisticRepository.countRecords(todayStart, tomorrow, clinicId),
      this.statisticRepository.countRecords(weekStart, weekEnd, clinicId),
      this.statisticRepository.countRecords(monthStart, monthEnd, clinicId),
      this.statisticRepository.countNewPatientsWithoutRecordsInRange(
        todayStart,
        tomorrow,
        clinicId,
      ),
      this.statisticRepository.countNewPatientsWithoutRecordsInRange(
        weekStart,
        weekEnd,
        clinicId,
      ),
      this.statisticRepository.countNewPatientsWithoutRecordsInRange(
        monthStart,
        monthEnd,
        clinicId,
      ),
    ]);

    const today = todayRecords + todayNewPatients;
    const week = weekRecords + weekNewPatients;
    const month = monthRecords + monthNewPatients;

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
    const [rows, newPatients] = await Promise.all([
      this.statisticRepository.recordsInRange(chartFrom, chartTo, clinicId),
      this.statisticRepository.patientsWithoutRecordsInRange(
        chartFrom,
        chartTo,
        clinicId,
      ),
    ]);

    const buckets = new Map<string, number>();
    for (const r of rows) {
      if (!r.createdAt) continue;
      const key = this.vnBucketKeyFromUtc(r.createdAt, range);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    for (const p of newPatients) {
      if (!p.createdAt) continue;
      const key = this.vnBucketKeyFromUtc(p.createdAt, range);
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

  public async getRevenueStatistics(
    range: RangeType = "day",
    points = 7,
    clinicId?: string,
    options?: {
      date?: string;
      startDate?: string;
      weekNumber?: number;
      year?: number;
      month?: number;
      view?: MonthView;
    },
  ) {
    const hasNewParams = Boolean(
      options?.date ||
        options?.startDate ||
        options?.weekNumber ||
        options?.year ||
        options?.month ||
        options?.view,
    );

    if (hasNewParams) {
      return this.getRevenueStatisticsByPeriod(range, clinicId, options);
    }

    const safePoints = Number.isFinite(points) ? Math.max(1, points) : 7;

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

    const [prescriptions, profitItems, consultationFees, dispensedPrescriptions] =
      await Promise.all([
        this.statisticRepository.findDispensedPrescriptionTotalsInRange(
          chartFrom,
          chartTo,
          clinicId,
        ),
      this.statisticRepository.findDispensedPrescriptionProfitsInRange(
        chartFrom,
        chartTo,
        clinicId,
      ),
        this.statisticRepository.findConsultationFeesInRange(
          chartFrom,
          chartTo,
          clinicId,
        ),
        this.statisticRepository.findDispensedPrescriptionsInRange(
          chartFrom,
          chartTo,
          clinicId,
        ),
      ]);

    const prescriptionByBucket = new Map<string, number>();
    const profitByBucket = new Map<string, number>();
    const consultationByBucket = new Map<string, number>();

    for (const p of prescriptions) {
      if (!p.dispensedAt) continue;
      const key = this.vnBucketKeyFromUtc(p.dispensedAt, range);
      const val = p.totalPrice ? Number(p.totalPrice) : 0;
      prescriptionByBucket.set(key, (prescriptionByBucket.get(key) ?? 0) + val);
    }

    for (const p of profitItems) {
      if (!p.dispensedAt) continue;
      const key = this.vnBucketKeyFromUtc(p.dispensedAt, range);
      profitByBucket.set(key, (profitByBucket.get(key) ?? 0) + p.profit);
    }

    for (const c of consultationFees) {
      if (!c.createdAt) continue;
      const key = this.vnBucketKeyFromUtc(c.createdAt, range);
      const val = c.consultationFee ? Number(c.consultationFee) : 0;
      consultationByBucket.set(key, (consultationByBucket.get(key) ?? 0) + val);
    }

    const labels: string[] = [];
    const prescriptionValues: number[] = [];
    const profitValues: number[] = [];
    const consultationValues: number[] = [];

    for (const start of starts) {
      const key = this.vnBucketKeyFromUtc(start, range);
      labels.push(this.labelFromBucketStartUtc(start, range));
      prescriptionValues.push(prescriptionByBucket.get(key) ?? 0);
      profitValues.push(profitByBucket.get(key) ?? 0);
      consultationValues.push(consultationByBucket.get(key) ?? 0);
    }

    const totalPrescription = prescriptionValues.reduce((a, b) => a + b, 0);
    const totalProfit = profitValues.reduce((a, b) => a + b, 0);
    const totalConsultation = consultationValues.reduce((a, b) => a + b, 0);
    const { medicineBreakdown, medicineTypeBreakdown, totalProfitMedicine } =
      this.buildMedicineProfitSummary(dispensedPrescriptions);

    return {
      totalRevenue: totalPrescription + totalConsultation,
      totalPrescription,
      totalProfit,
      totalProfitMedicine,
      totalConsultation,
      medicineBreakdown,
      medicineTypeBreakdown,
      chart: {
        labels,
        prescriptionValues,
        profitValues,
        consultationValues,
        range,
      },
    };
  }

  private async getRevenueStatisticsByPeriod(
    range: RevenueView,
    clinicId?: string,
    options?: {
      date?: string;
      startDate?: string;
      weekNumber?: number;
      year?: number;
      month?: number;
      view?: MonthView;
    },
  ) {
    const nowUtc = new Date();

    if (range === "day") {
      const startUtc =
        this.parseVnDateInput(options?.date) ?? this.vnStartOfDayUtc(nowUtc);
      const endUtc = this.addDays(startUtc, 1);

      const [prescriptions, profitItems, consultationFees, dispensedPrescriptions] =
        await Promise.all([
          this.statisticRepository.findDispensedPrescriptionTotalsInRange(
            startUtc,
            endUtc,
            clinicId,
          ),
        this.statisticRepository.findDispensedPrescriptionProfitsInRange(
          startUtc,
          endUtc,
          clinicId,
        ),
          this.statisticRepository.findConsultationFeesInRange(
            startUtc,
            endUtc,
            clinicId,
          ),
          this.statisticRepository.findDispensedPrescriptionsInRange(
            startUtc,
            endUtc,
            clinicId,
          ),
        ]);

      const startHour = 6;
      const endHour = 23;
      const bucketCount = endHour - startHour + 1;
      const labels: string[] = [];
      const prescriptionValues = Array.from({ length: bucketCount }, () => 0);
      const profitValues = Array.from({ length: bucketCount }, () => 0);
      const consultationValues = Array.from({ length: bucketCount }, () => 0);

      for (let h = startHour; h <= endHour; h++) {
        labels.push(this.pad2(h));
      }

      for (const p of prescriptions) {
        if (!p.dispensedAt) continue;
        const vn = this.toVnWallClock(p.dispensedAt);
        const hour = vn.getUTCHours();
        if (hour < startHour || hour > endHour) continue;
        const val = p.totalPrice ? Number(p.totalPrice) : 0;
        prescriptionValues[hour - startHour] += val;
      }

      for (const p of profitItems) {
        if (!p.dispensedAt) continue;
        const vn = this.toVnWallClock(p.dispensedAt);
        const hour = vn.getUTCHours();
        if (hour < startHour || hour > endHour) continue;
        profitValues[hour - startHour] += p.profit;
      }

      for (const c of consultationFees) {
        if (!c.createdAt) continue;
        const vn = this.toVnWallClock(c.createdAt);
        const hour = vn.getUTCHours();
        if (hour < startHour || hour > endHour) continue;
        const val = c.consultationFee ? Number(c.consultationFee) : 0;
        consultationValues[hour - startHour] += val;
      }

      const totalPrescription = prescriptionValues.reduce((a, b) => a + b, 0);
      const totalProfit = profitValues.reduce((a, b) => a + b, 0);
      const totalConsultation = consultationValues.reduce((a, b) => a + b, 0);
      const { medicineBreakdown, medicineTypeBreakdown, totalProfitMedicine } =
        this.buildMedicineProfitSummary(dispensedPrescriptions);

      return {
        totalRevenue: totalPrescription + totalConsultation,
        totalPrescription,
        totalProfit,
        totalProfitMedicine,
        totalConsultation,
        medicineBreakdown,
        medicineTypeBreakdown,
        chart: {
          labels,
          prescriptionValues,
          profitValues,
          consultationValues,
          range,
          granularity: "hour",
        },
      };
    }

    if (range === "week") {
      let weekStartUtc: Date | null = null;
      if (options?.startDate) {
        const parsed = this.parseVnDateInput(options.startDate);
        weekStartUtc = parsed ? this.vnStartOfWeekUtc(parsed) : null;
      } else if (options?.weekNumber && options?.year) {
        weekStartUtc = this.vnStartOfIsoWeekUtc(
          options.year,
          options.weekNumber,
        );
      }

      const startUtc = weekStartUtc ?? this.vnStartOfWeekUtc(nowUtc);
      const endUtc = this.addDays(startUtc, 7);

      const [prescriptions, profitItems, consultationFees, dispensedPrescriptions] =
        await Promise.all([
          this.statisticRepository.findDispensedPrescriptionTotalsInRange(
            startUtc,
            endUtc,
            clinicId,
          ),
        this.statisticRepository.findDispensedPrescriptionProfitsInRange(
          startUtc,
          endUtc,
          clinicId,
        ),
          this.statisticRepository.findConsultationFeesInRange(
            startUtc,
            endUtc,
            clinicId,
          ),
          this.statisticRepository.findDispensedPrescriptionsInRange(
            startUtc,
            endUtc,
            clinicId,
          ),
        ]);

      const labels: string[] = [];
      const prescriptionValues: number[] = [];
      const profitValues: number[] = [];
      const consultationValues: number[] = [];
      const bucketMap = new Map<string, number>();

      const starts: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = this.addDays(startUtc, i);
        starts.push(d);
        const key = this.vnBucketKeyFromUtc(d, "day");
        bucketMap.set(key, i);
        labels.push(this.formatVnDateLabelFromUtc(d));
        prescriptionValues.push(0);
        profitValues.push(0);
        consultationValues.push(0);
      }

      for (const p of prescriptions) {
        if (!p.dispensedAt) continue;
        const key = this.vnBucketKeyFromUtc(p.dispensedAt, "day");
        const idx = bucketMap.get(key);
        if (idx === undefined) continue;
        const val = p.totalPrice ? Number(p.totalPrice) : 0;
        prescriptionValues[idx] += val;
      }

      for (const p of profitItems) {
        if (!p.dispensedAt) continue;
        const key = this.vnBucketKeyFromUtc(p.dispensedAt, "day");
        const idx = bucketMap.get(key);
        if (idx === undefined) continue;
        profitValues[idx] += p.profit;
      }

      for (const c of consultationFees) {
        if (!c.createdAt) continue;
        const key = this.vnBucketKeyFromUtc(c.createdAt, "day");
        const idx = bucketMap.get(key);
        if (idx === undefined) continue;
        const val = c.consultationFee ? Number(c.consultationFee) : 0;
        consultationValues[idx] += val;
      }

      const totalPrescription = prescriptionValues.reduce((a, b) => a + b, 0);
      const totalProfit = profitValues.reduce((a, b) => a + b, 0);
      const totalConsultation = consultationValues.reduce((a, b) => a + b, 0);
      const { medicineBreakdown, medicineTypeBreakdown, totalProfitMedicine } =
        this.buildMedicineProfitSummary(dispensedPrescriptions);

      return {
        totalRevenue: totalPrescription + totalConsultation,
        totalPrescription,
        totalProfit,
        totalProfitMedicine,
        totalConsultation,
        medicineBreakdown,
        medicineTypeBreakdown,
        chart: {
          labels,
          prescriptionValues,
          profitValues,
          consultationValues,
          range,
          granularity: "day",
        },
      };
    }

    const year =
      options?.year && Number.isFinite(options.year)
        ? options.year
        : this.toVnWallClock(nowUtc).getUTCFullYear();
    const month =
      options?.month && Number.isFinite(options.month)
        ? options.month
        : this.toVnWallClock(nowUtc).getUTCMonth() + 1;

    const monthStartUtc = this.fromVnWallClock(
      new Date(Date.UTC(year, month - 1, 1)),
    );
    const monthEndUtc = this.addMonths(monthStartUtc, 1);

    const [prescriptions, profitItems, consultationFees, dispensedPrescriptions] =
      await Promise.all([
        this.statisticRepository.findDispensedPrescriptionTotalsInRange(
          monthStartUtc,
          monthEndUtc,
          clinicId,
        ),
      this.statisticRepository.findDispensedPrescriptionProfitsInRange(
        monthStartUtc,
        monthEndUtc,
        clinicId,
      ),
        this.statisticRepository.findConsultationFeesInRange(
          monthStartUtc,
          monthEndUtc,
          clinicId,
        ),
        this.statisticRepository.findDispensedPrescriptionsInRange(
          monthStartUtc,
          monthEndUtc,
          clinicId,
        ),
      ]);

    const firstWeekStartUtc = this.vnStartOfWeekUtc(monthStartUtc);
    const weekStarts: Date[] = [];
    const labels: string[] = [];
    const prescriptionValues: number[] = [];
    const profitValues: number[] = [];
    const consultationValues: number[] = [];
    const bucketIndex = new Map<string, number>();

    for (let cursor = firstWeekStartUtc; cursor < monthEndUtc; ) {
      const key = cursor.toISOString();
      const labelDate = cursor < monthStartUtc ? monthStartUtc : cursor;
      bucketIndex.set(key, weekStarts.length);
      weekStarts.push(cursor);
      labels.push(this.formatVnDateLabelFromUtc(labelDate));
      prescriptionValues.push(0);
      profitValues.push(0);
      consultationValues.push(0);
      cursor = this.addDays(cursor, 7);
    }

    for (const p of prescriptions) {
      if (!p.dispensedAt) continue;
      const weekStart = this.vnStartOfWeekUtc(p.dispensedAt);
      const idx = bucketIndex.get(weekStart.toISOString());
      if (idx === undefined) continue;
      const val = p.totalPrice ? Number(p.totalPrice) : 0;
      prescriptionValues[idx] += val;
    }

    for (const p of profitItems) {
      if (!p.dispensedAt) continue;
      const weekStart = this.vnStartOfWeekUtc(p.dispensedAt);
      const idx = bucketIndex.get(weekStart.toISOString());
      if (idx === undefined) continue;
      profitValues[idx] += p.profit;
    }

    for (const c of consultationFees) {
      if (!c.createdAt) continue;
      const weekStart = this.vnStartOfWeekUtc(c.createdAt);
      const idx = bucketIndex.get(weekStart.toISOString());
      if (idx === undefined) continue;
      const val = c.consultationFee ? Number(c.consultationFee) : 0;
      consultationValues[idx] += val;
    }

    const totalPrescription = prescriptionValues.reduce((a, b) => a + b, 0);
    const totalProfit = profitValues.reduce((a, b) => a + b, 0);
    const totalConsultation = consultationValues.reduce((a, b) => a + b, 0);
    const { medicineBreakdown, medicineTypeBreakdown, totalProfitMedicine } =
      this.buildMedicineProfitSummary(dispensedPrescriptions);

    return {
      totalRevenue: totalPrescription + totalConsultation,
      totalPrescription,
      totalProfit,
      totalProfitMedicine,
      totalConsultation,
      medicineBreakdown,
      medicineTypeBreakdown,
      chart: {
        labels,
        prescriptionValues,
        profitValues,
        consultationValues,
        range,
        granularity: "week",
      },
    };
  }

}
