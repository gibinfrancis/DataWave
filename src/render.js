function replaceMe(template, data) {
  const pattern = /{\s*(\w+?)\s*}/g; // {property}
  return template.replace(pattern, (_, token) => data[token] || "");
}

const html = `
    <div>
      <h4>{title}</h4>
      <p>My name is {name}</p>
      <img src="{url}" />
    </div>
  `;

const data = {
  title: "My Profile",
  name: "John Smith",
  url: "http://images/john.jpeg",
};

replaceMe(html, data);
