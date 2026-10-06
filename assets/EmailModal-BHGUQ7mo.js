import{r as i,j as e}from"./vendor-framework-CM3K1KOW.js";import{b as z,a as L}from"./index-RZFFynyp.js";import"./vendor-misc-DeBGxI1J.js";import"./vendor-firebase-core-BHkjHWxG.js";const j=[{id:"general",name:"General Value Pitch",subject:"Quick question regarding {businessName}",body:`Hi there,

I came across {businessName} on {platform} and was impressed by what you're doing in {location}.

I'm {senderName}, and I specialize in {serviceName}. I noticed there might be an opportunity to help {businessName} grow even further — whether that's through improving your online presence, streamlining operations, or reaching more high-value clients.

Would you be open to a quick 10-minute call this week to explore how we could help {businessName}?

Best regards,
{senderName}`},{id:"web-design",name:"Website & UI Redesign",subject:"Modernizing {businessName}'s digital presence",body:`Hi {businessName} team,

I was looking for {category} options in {location} on {platform} and found your business.

I noticed your current online presence could convert significantly more customers with a modern, high-speed mobile website and direct booking/contact buttons.

I help local businesses like yours turn visitors into paying customers. Would you be open to seeing a 2-minute video mockup of how your site could look?

Best,
{senderName}`},{id:"local-seo",name:"Google Maps & Local SEO",subject:"Ranking {businessName} higher on Google Maps in {location}",body:`Hello,

I noticed that when searching for {category} in {location}, {businessName} isn't ranking in the top 3 Google Maps map pack.

Missing out on the top 3 means competitors are capturing up to 70% of inbound customer calls in your area.

I specialize in local search optimization and Google Business Profile ranking. Would you like a free 3-point audit showing how to get into the top 3 this month?

Cheers,
{senderName}`},{id:"social-media",name:"Social Media & Lead Gen",subject:"Generating more inbound inquiries for {businessName}",body:`Hi team,

I love what you've built with {businessName} in {location}.

Are you currently taking on new clients? I help {category} companies set up automated lead generation and social media campaigns that consistently bring in qualified local inquiries.

Can I send over a quick 1-page breakdown of how we did this for a similar business last month?

Best,
{senderName}`}],P=({isOpen:v,onClose:n,selectedLead:o})=>{const{leads:m=[],currentQuery:u={}}=z()||{},{currentUser:w}=L()||{},a=Array.isArray(m)?m.filter(Boolean):[],r=Array.isArray(j)?j:[],[l,c]=i.useState(o?.id||""),[p,k]=i.useState("general"),[h,S]=i.useState(w?.name||""),[g,I]=i.useState("Web Design & Local SEO"),[d,b]=i.useState(!1);if(i.useEffect(()=>{o?c(o.id):a.length>0&&!l&&c(a[0].id)},[o,a]),!v)return null;const t=a.find(s=>s.id===l)||o,y=r.find(s=>s.id===p)||r[0]||{subject:"",body:""},C=t&&t.name||"[Business Name]",E=t&&t.source_platform||"Google Maps",G=u?.loc||"your city",M=u?.biz||"business",T=h.trim()||"[Your Name]",A=g.trim()||"[Your Service]",N=s=>s.replace(/{businessName}/g,C).replace(/{platform}/g,E).replace(/{location}/g,G).replace(/{category}/g,M).replace(/{senderName}/g,T).replace(/{serviceName}/g,A),x=N(y.subject),f=N(y.body),B=`Subject: ${x}

${f}`,q=async()=>{try{await navigator.clipboard.writeText(B),b(!0),setTimeout(()=>b(!1),2e3)}catch{}};return e.jsx("div",{className:"modal-overlay open",onClick:n,children:e.jsxs("div",{className:"modal",onClick:s=>s.stopPropagation(),children:[e.jsxs("div",{className:"modal-header",children:[e.jsx("h3",{children:"Cold Outreach Email Generator"}),e.jsx("button",{type:"button",className:"modal-close",onClick:n,children:e.jsx("i",{className:"ri-close-line"})})]}),e.jsx("p",{className:"modal-sub",children:"Generate high-converting, personalized cold email scripts based on your target lead."}),e.jsxs("div",{className:"modal-form-grid",children:[e.jsxs("div",{className:"fg",children:[e.jsx("label",{children:"Target Lead"}),e.jsxs("select",{value:l,onChange:s=>c(s.target.value),className:"modal-select",children:[a.map(s=>e.jsxs("option",{value:s.id,children:[s.name," (",s.source_platform,")"]},s.id)),!a.length&&e.jsx("option",{value:"",children:"No leads in pipeline"})]})]}),e.jsxs("div",{className:"fg",children:[e.jsx("label",{children:"Template Archetype"}),e.jsx("select",{value:p,onChange:s=>k(s.target.value),className:"modal-select",children:r.map(s=>e.jsx("option",{value:s.id,children:s.name},s.id))})]}),e.jsxs("div",{className:"fg",children:[e.jsx("label",{children:"Your Name"}),e.jsx("input",{type:"text",maxLength:100,value:h,onChange:s=>S(s.target.value),placeholder:"e.g. Alex"})]}),e.jsxs("div",{className:"fg",children:[e.jsx("label",{children:"Service / Skill You Offer"}),e.jsx("input",{type:"text",maxLength:100,value:g,onChange:s=>I(s.target.value),placeholder:"e.g. Next.js Website, SEO, Video Editing"})]})]}),e.jsxs("div",{className:"template-preview-box",children:[e.jsxs("div",{className:"template-subject-line",children:[e.jsx("strong",{children:"Subject:"})," ",x]}),e.jsx("textarea",{className:"template-output",readOnly:!0,value:f,rows:10})]}),e.jsxs("div",{className:"modal-actions",children:[e.jsxs("button",{type:"button",className:`leads-btn ${d?"copied":""}`,onClick:q,children:[e.jsx("i",{className:d?"ri-check-line":"ri-file-copy-line"}),e.jsx("span",{children:d?"Copied to Clipboard!":"Copy Email Script"})]}),e.jsx("button",{type:"button",className:"leads-btn secondary",onClick:n,children:"Close"})]})]})})};export{P as EmailModal};
