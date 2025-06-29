import pyttsx3
import speech_recognition as sr
import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import re
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Voice Setup
engine = pyttsx3.init()
voices = engine.getProperty('voices')
engine.setProperty('voice', voices[1].id)

def speak(text):
    print("Caretaker:", text)
    engine.say(text)
    engine.runAndWait()

def warm_up_voice():
    engine.say(" ")
    engine.runAndWait()
    time.sleep(0.3)

def takeCommand():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening...")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source, timeout=10)
    try:
        command = recognizer.recognize_google(audio, language="en-in")
        print(f"User said: {command}")
        return command.lower()
    except sr.UnknownValueError:
        speak("Sorry, I didn't catch that. Please repeat.")
        return "none"
    except sr.RequestError:
        speak("Sorry, I'm having trouble with the voice service. Please try again later.")
        return "none"

def convert_spoken_number_to_digits(spoken_text):
    number_map = {
        "zero": "0", "oh": "0", "o": "0",
        "one": "1", "two": "2", "three": "3", "four": "4",
        "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9"
    }
    words = spoken_text.lower().strip().split()
    digits = ''.join([number_map.get(word, '') for word in words])
    if not digits:
        digits = ''.join(re.findall(r'\d', spoken_text))
    return digits

def join_queue_automation():
    speak("Welcome to QueueCare. Please say the name of the hospital.")
    hospitals = [
        "Promhex Multispeciality Hospital",
        "Felix Hospital",
        "Riverdale Healthcare",
        "Yatharth Super Speciality Hospital",
        "Apollo Spectra Hospital"
    ]

    for name in hospitals:
        speak(name)

    selected_hospital = None
    while not selected_hospital:
        said = takeCommand()
        for name in hospitals:
            if name.lower() in said:
                selected_hospital = name
                break
        if not selected_hospital:
            speak("Please say a valid hospital name from the list.")

    speak(f"You selected {selected_hospital}")

    # Services
    speak("Now please say the name of the service you want.")
    services = [
        "General Consultation", "Pediatrics", "Blood Test", "Diagnostic Imaging",
        "Dental Checkup", "Eye Examination", "Cardiology", "Vaccination",
        "Mental Health Support", "Orthopedics"
    ]

    for name in services:
        speak(name)

    selected_service = None
    while not selected_service:
        said = takeCommand()
        for name in services:
            if name.lower() in said:
                selected_service = name
                break
        if not selected_service:
            speak("Please say a valid service name from the list.")

    speak(f"You selected {selected_service}")

    # Ask for user's name
    name = None
    while not name or name == "none":
        speak("Please say your name.")
        name = takeCommand()
        if name == "none":
            speak("I couldn't hear your name. Please repeat.")

    # Phone Number
    while True:
        speak(f"{name.title()}, please say your 10-digit phone number, one digit at a time.")
        spoken_input = takeCommand()
        phone_number = convert_spoken_number_to_digits(spoken_input)

        if len(phone_number) == 10:
            break
        else:
            speak(f"I heard {phone_number}. That doesn't seem like 10 digits. Let's try again.")

    # Today's date
    today = datetime.datetime.today().strftime('%Y-%m-%d')
    speak(f"Using today's date: {today}")

    # Confirmation with retries using 'confirm' or 'cancel'
    confirmation_attempts = 3
    confirmed = False

    speak(f"To confirm, you are {name.title()}, booking {selected_service} at {selected_hospital} on {today}.")
    speak("Please say 'confirm' to continue or 'cancel' to stop.")

    while confirmation_attempts > 0 and not confirmed:
        confirmation = takeCommand()

        if confirmation == "none":
            speak("I didn't catch that. Please clearly say 'confirm' or 'cancel'.")
            continue

        confirmation = confirmation.strip().lower()
        print(f"DEBUG: Confirmation command received: {confirmation}")

        if "confirm" in confirmation or "yes" in confirmation:
            confirmed = True
            break
        elif "cancel" in confirmation or "no" in confirmation:
            speak("Booking canceled.")
            return
        else:
            confirmation_attempts -= 1
            if confirmation_attempts > 0:
                speak(f"Unrecognized response. You have {confirmation_attempts} attempts left. Say 'confirm' to proceed or 'cancel' to stop.")
            else:
                speak("Too many failed attempts. Canceling the booking.")
                return

    # Launch browser and go to page
    speak("Entering details to join the queue.")
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--start-maximized")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

    try:
        driver.get("http://localhost:5000/user.html")
        time.sleep(2)

        # Click hospital
        for card in driver.find_elements(By.CLASS_NAME, "hospital-card"):
            if selected_hospital.lower() in card.text.lower():
                driver.execute_script("arguments[0].click();", card)
                break

        time.sleep(0.5)

        # Click service
        for card in driver.find_elements(By.CLASS_NAME, "service-card"):
            if selected_service.lower() in card.text.lower():
                driver.execute_script("arguments[0].click();", card)
                break

        time.sleep(0.5)

        # Fill form
        driver.find_element(By.ID, "name").send_keys(name.title())
        driver.find_element(By.ID, "phone").send_keys(phone_number)
        driver.find_element(By.ID, "appointmentDate").send_keys(today)

        # Submit
        wait = WebDriverWait(driver, 10)
        join_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Join Queue']")))
        driver.execute_script("arguments[0].click();", join_button)
        time.sleep(2)

        # Log to file
        with open("queue_log.txt", "a") as log_file:
            log_file.write(f"{datetime.datetime.now()} - {name.title()} | {phone_number} | {selected_service} at {selected_hospital} on {today}\n")

        speak("You are successfully added to the queue.")

        # Inject JS to wait for ticket-related actions
        driver.execute_script("""
            window.userActionDone = false;
            function markDone() { window.userActionDone = true; }

            function tryAttachListener(label) {
                let buttons = [...document.querySelectorAll("button")];
                for (let btn of buttons) {
                    if (btn.innerText.includes(label)) {
                        btn.addEventListener("click", markDone);
                    }
                }
            }

            tryAttachListener("Print Ticket");
            tryAttachListener("Send via WhatsApp");
            tryAttachListener("Leave Queue");
        """)

        speak("Please print your ticket, send it via WhatsApp, or leave the queue when you're done.")

        # Wait until one of those actions is performed
        while True:
            done = driver.execute_script("return window.userActionDone;")
            if done:
                break
            time.sleep(1)


        speak("Action detected. Closing the browser.")
    
    finally:
        driver.quit()
        speak("Browser closed. Have a great day!")

# Main Entry Point
if __name__ == "__main__":
    warm_up_voice()
    time.sleep(0.2)
    speak("Hello. I am Caretaker, your healthcare assistant.")
    join_queue_automation()
