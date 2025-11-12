export const CompanyLogos = () => {
  const companies = [
    { name: "XYLEM", logo: "🔧" },
    { name: "Indian Navy", logo: "⚓" },
    { name: "RENAULT", logo: "🚗" },
    { name: "CIAL", logo: "✈️" },
    { name: "MALABAR", logo: "💎" },
    { name: "KSRTC", logo: "🚌" },
    { name: "INDUS", logo: "🏢" },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-voxbay-gray mb-4">
            Trusted by industry leaders worldwide
          </h2>
          <p className="text-muted-foreground">
            Join thousands of companies that trust Auralis for their communication needs
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 items-center">
          {companies.map((company, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <div className="text-4xl mb-2">{company.logo}</div>
              <span className="text-sm font-medium text-voxbay-gray">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};