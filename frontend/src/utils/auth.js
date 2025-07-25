export function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}

export function getUserGroup() {
  try {
    return JSON.parse(localStorage.getItem("userGroup")) || [];
  } catch {
    return [];
  }
}

export function isAdmin() {
  const groups = getUserGroup()
  return groups.includes("BikeFranchise")
}

export function isRegisteredUser() {
  const groups = getUserGroup()
  return groups.length > 0 && !groups.includes("BikeFranchise")
}