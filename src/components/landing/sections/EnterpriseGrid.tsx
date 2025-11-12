/* eslint-disable @typescript-eslint/no-explicit-any */
export default function GridLayout() {
  const colors = ["#ccccff", "#1c39bb", "#e8ebf8", "#d1d5db", "#8e9cdd"];
  const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

  const content: Record<number, { title: string; description: string }> = {
    0: {
      title: "Fully Compliant Platform",
      description:
        "Auralis is SOC 2 Type 1&2, HIPAA, and GDPR compliant, meeting all industry compliance standards.",
    },
    1: {
      title: "Voice AI API",
      description:
        "Natural, smooth, and empathetic AI conversations with only 500ms latency.",
    },
    2: {
      title: "Multilingual Support",
      description:
        "Support 18+ languages, can dial to any country's phone numbers",
    },
    3: {
      title: "Display Branded Call ID",
      description:
        "Enable Auralis AI Branded Call feature to unlock new levels of customer trust and satisfaction for outbound call operations",
    },
    4: {
      title: "Reliable and Stable Platform You Can Trust",
      description:
        "With average 99.99% uptime and effortless fallback. Auralis AI ensures your phone callers are always production-ready.",
    },
  };

  return (
    <div className="p-4">
      <style >{`
        .grid-container {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(6, 1fr);
          gap: 8px;
          width: 100%;
          height: 400px;
        }

        .grid-item {
          border-radius: 5px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-direction: column;
          font-size: 150%;
          text-align: left;
        }

        .item-0 {
          grid-column: 1 / span 4;
          grid-row: 1 / span 2;
          background-color: ${shuffledColors[0]};
          color: ${shuffledColors[0] === "#1c39bb" ? "#fff" : "#000"};
        }

        .item-1 {
          grid-column: 5 / span 2;
          grid-row: 1 / span 3;
          background-color: ${shuffledColors[1]};
          color: ${shuffledColors[1] === "#1c39bb" ? "#fff" : "#000"};
        }

        .item-2 {
          grid-column: 1 / span 2;
          grid-row: 3 / span 4;
          background-color: ${shuffledColors[2]};
          color: ${shuffledColors[2] === "#1c39bb" ? "#fff" : "#000"};
        }

        .item-3 {
          grid-column: 3 / span 2;
          grid-row: 3 / span 4;
          background-color: ${shuffledColors[3]};
          color: ${shuffledColors[3] === "#1c39bb" ? "#fff" : "#000"};
        }

        .item-4 {
          grid-column: 5 / span 2;
          grid-row: 4 / span 3;
          background-color: ${shuffledColors[4]};
          color: ${shuffledColors[4] === "#1c39bb" ? "#fff" : "#000"};
        }

        /* ✅ Tablet view - 2 columns */
        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
            height: auto;
            gap: 12px;
          }

          .grid-item {
            grid-column: auto !important;
            grid-row: auto !important;
            font-size: 120%;
            padding: 16px;
            min-height: 120px;
          }
        }

        /* ✅ Mobile view - 1 column */
        @media (max-width: 480px) {
          .grid-container {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .grid-item {
            font-size: 100%;
            padding: 14px;
            min-height: 110px;
          }
        }
      `}</style>

      <div className="grid-container">
        <div className="grid-item item-0">
          <h3 style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: "6px" }}>
            {content[0].title}
          </h3>
          <p style={{ fontSize: "0.65em", lineHeight: "1.3" }}>{content[0].description}</p>
        </div>

        <div className="grid-item item-1">
          <h3 style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: "6px" }}>
            {content[1].title}
          </h3>
          <p style={{ fontSize: "0.65em", lineHeight: "1.3" }}>{content[1].description}</p>
        </div>

        <div className="grid-item item-2">
          <h3 style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: "6px" }}>
            {content[2].title}
          </h3>
          <p style={{ fontSize: "0.65em", lineHeight: "1.3" }}>{content[2].description}</p>
        </div>

        <div className="grid-item item-3">
          <h3 style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: "6px" }}>
            {content[3].title}
          </h3>
          <p style={{ fontSize: "0.65em", lineHeight: "1.3" }}>{content[3].description}</p>
        </div>

        <div className="grid-item item-4">
          <h3 style={{ fontSize: "0.9em", fontWeight: "bold", marginBottom: "6px" }}>
            {content[4].title}
          </h3>
          <p style={{ fontSize: "0.65em", lineHeight: "1.3" }}>{content[4].description}</p>
        </div>
      </div>
    </div>
  );
}
