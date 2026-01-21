import { LinkItem, UserProfile } from '../types';

// GANTI URL INI DENGAN URL WEB APP DEPLOYMENT ANDA DARI GOOGLE APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycbyu5UgdK6ZoCKlE9hCk7l_dFWLJO9_Ht6-jbu8CXfEv7HGD-lhP0NmlcveIJ9FNywli/exec';

// Check if the URL is still the default placeholder
const isPlaceholder = API_URL.includes('PLACEHOLDER');

export const fetchSchoolData = async () => {
  if (isPlaceholder) {
    console.warn("API URL is a placeholder. Using local default data.");
    return null;
  }

  try {
    const url = `${API_URL}?action=getData&t=${Date.now()}`;
    
    // CRITICAL FIX: 
    // 1. method: 'GET'
    // 2. credentials: 'omit' -> Prevents sending cookies, which confuses Google if logged into multiple accounts.
    // 3. redirect: 'follow' -> Follows the 302 redirect to googleusercontent.com
    const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        credentials: 'omit',
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Check for HTML response (Google Error Page)
    if (text.trim().startsWith("<") || text.includes("<!DOCTYPE html>")) {
        throw new Error("Server returned HTML instead of JSON. Ensure deployment is 'Anyone' (Anonymous).");
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn("Response was not valid JSON. Raw:", text.substring(0, 100));
        throw new Error("Invalid JSON response from server");
    }

  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

export const saveSchoolData = async (links: LinkItem[], profile: UserProfile) => {
  if (isPlaceholder) {
    console.warn("API URL is a placeholder. Save action simulated.");
    return { status: "success" };
  }

  try {
    // POST request must use text/plain to avoid OPTIONS preflight
    const response = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      credentials: 'omit', // Important for POST as well
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      },
      body: JSON.stringify({
        action: 'saveData',
        links,
        profile
      })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        return { status: "success", raw: text };
    }
  } catch (error) {
    console.error("Error saving data:", error);
    throw error;
  }
};