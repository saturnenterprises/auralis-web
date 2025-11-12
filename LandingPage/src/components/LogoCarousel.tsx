import React from 'react';

const LogoCarousel = () => {
  const logos = [
    { name: 'n8n', url: '/logos/1.png', showName: false },
    { name: 'Gohighlevel', url: '/logos/2.png', showName: false },
    { name: 'Twilio', url: '/logos/3.png', showName: false },
    { name: 'Vonage', url: '/logos/4.png', showName: false },
    { name: 'OpenAI', url: '/logos/5.png', showName: false },
    { name: 'Cal.com', url: '/logos/6.png', showName: false },
  ];

  return (
    <div className="logo-carousel-container bg-white" style={{
      overflow: 'hidden',
      boxSizing: 'border-box',
      padding: '20px 0',
      position: 'relative',
    }}>
      <style>
        {`
        @keyframes scroll-logos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .logo-carousel-inner { display: flex; width: max-content; animation: scroll-logos 30s linear infinite; }
        .logo-group { display: flex; }
        .logo-item { display: inline-flex; align-items: center; justify-content: center; margin: 0 40px; text-align: center; }
        .logo-item img { height: 50px; }
        .logo-name { margin-top: 10px; font-size: 14px; color: #555; text-transform: uppercase; }
        `}
      </style>
      <div className="mx-auto max-w-3xl px-6 text-center mb-16 md:mb-20">
        <h2 className="text-2xl md:text-4xl font-medium tracking-tight text-gray-900">
          Seamlessly Integrate with your tech stack
        </h2>
        <p className="mt-4 text-gray-600 md:text-lg">
          With native and external connectivity to any CRM, telephony, automation platform, and database, building and deploying phone agents has never been easier.
        </p>
      </div>
     
      <div className="logo-carousel-inner">
        <div className="logo-group">
          {logos.map((logo, index) => (
            <div key={index} className="logo-item">
              <div>
                <img src={logo.url} alt={`${logo.name} logo`} />
                {logo.showName !== false && <div className="logo-name">{logo.name}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="logo-group" aria-hidden="true">
          {logos.map((logo, index) => (
            <div key={`duplicate-${index}`} className="logo-item">
              <div>
                <img src={logo.url} alt="" />
                {logo.showName !== false && <div className="logo-name">{logo.name}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoCarousel;


