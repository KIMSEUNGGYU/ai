import type { HourlyActivity as HourlyActivityType } from "@/lib/types";

interface HourlyActivityProps {
  hourly: HourlyActivityType[];
}

export function HourlyActivity({ hourly }: HourlyActivityProps) {
  const maxCount = Math.max(...hourly.map((h) => h.count), 1);
  const allHours = Array.from({ length: 24 }, (_, i) => {
    const found = hourly.find((h) => h.hour === i);
    return { hour: i, count: found?.count ?? 0 };
  });

  return (
    <section>
      <h2 style={styles.title}>HOURLY ACTIVITY</h2>
      <div style={styles.chart}>
        {allHours.map((h) => (
          <div key={h.hour} style={styles.barWrapper}>
            <div
              style={{
                ...styles.bar,
                height: `${(h.count / maxCount) * 100}%`,
                background: h.count > 0 ? "#8957e5" : "#21262d",
              }}
            />
            <span style={styles.label}>
              {h.hour.toString().padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: "#8b949e",
    marginBottom: 12,
  },
  chart: {
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 80,
    padding: "0 4px",
  },
  barWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: "2px 2px 0 0",
    minHeight: 2,
    transition: "height 0.3s ease",
  },
  label: {
    fontSize: 8,
    color: "#484f58",
    marginTop: 2,
  },
};
