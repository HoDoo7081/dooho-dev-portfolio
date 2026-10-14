# Process models

<sub>🌐 English · [← Project README](../README.md)</sub>

The CSV files in this folder are the Korean-language **source data** behind the process maps (Lucid import format: `Step → Next Step`, actor, type, condition). The summary below is in English.

| File | What it holds |
|---|---|
| `silverbridge_L1_swimlane_v2.csv` | L1 swimlane: 5 lanes (traveler, Local Friend, concierge, system, admin), 53 steps |
| `silverbridge_L1_process_detailed.csv` | L1 end-to-end flow as a step graph |
| `silverbridge_L2_process_final.csv` | L2 detail: sign-up and identity verification through booking, safety and review |
| `silverbridge_table_dictionary.csv` | Table dictionary seed: table, description, key columns, relationships |

## L1 swimlane in one view

| Lane | Journey |
|---|---|
| **Traveler** | Learns of the service → installs the app → signs up (child or senior) → enters health, mobility limits and interests → enters city, dates and budget → reviews the automatic Local Friend recommendations (adjusts filters if needed) → selects a Local Friend and creates a booking request → pays → receives pre-trip guidance → checks in and shares status during the trip → writes a review and rating → shares a referral code |
| **Local Friend (host)** | Onboards with identity verification (ID, bank account) → registers service types and available dates → receives a booking-request alert → accepts, adjusts time / place, or declines with a reason → chats before the trip → meets and accompanies the senior on the day → reports feedback and any incidents → checks settlement |
| **Concierge** | Reviews customers who need consultation → reviews travel purpose and health information → proposes a tailored plan and safety rules → receives SOS / abnormal-event alerts → activates the local emergency network (hospital, family) → writes an incident and after-care report |
| **System** | Verifies sign-up / login and permissions → stores profile and preference data → runs the Local Friend matching engine on city, budget and health conditions → ranks and shows results (with reviews and safety grade) → processes payment through the PG and issues a voucher → confirms the booking and sends alerts → monitors check-ins and location during the trip → detects abnormal patterns and forwards SOS events to the concierge and admin → aggregates logs and metrics into the dashboard |
| **Admin** | Reviews and approves Local Friends → sets fees, commission and cancellation policy → handles reports and disputes → monitors operating metrics (NPS, repeat usage) → plans improvements and updates policy → produces reports for investors and partners |

The seven stages shown in the swimlane image in the project README are: onboarding, trip request, matching / approval, pre-trip exchange and plan confirmation, trip and safety management, trip end and review, re-engagement and referral.
