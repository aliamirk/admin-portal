export interface User {
    username: string;
    password: string;
    redirect: string;
  }
  

export const users = [
    { username: "omair", password: "omair72$2", redirect: "/admin" },
    { username: "obaid", password: "obaid#52#", redirect: "/admin" },
    { username: "mubashir", password: "mubashir14#5", redirect: "/admin" },
    { username: "nazim", password: "nazim@33#", redirect: "/admin" },
    { username: "rehman", password: "rehman@54#", redirect: "/admin" },
    { username: "mustafa", password: "mustafa#4@1", redirect: "/admin" },
    { username: "adil", password: "adil#28$", redirect: "/admin" }
  ];
  
  export const authenticate = (username: string, password: string) => {
    return users.find(
      (u) => u.username === username.toLowerCase() && u.password === password
    );
  };
  