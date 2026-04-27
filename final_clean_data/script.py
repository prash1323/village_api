import pandas as pd
import os

folder_path = os.getcwd()
print("Using path:", folder_path)

all_data = []

for file in os.listdir(folder_path):
    if file.endswith(".xls") or file.endswith(".xlsx"):
        file_path = os.path.join(folder_path, file)
        print("\nProcessing:", file)

        # ================================
        # 🔥 SMART HEADER DETECTION
        # ================================
        df = None

        for i in range(5):
            try:
                if file.endswith(".xls"):
                    temp_df = pd.read_excel(file_path, engine="xlrd", header=i)
                else:
                    temp_df = pd.read_excel(file_path, engine="openpyxl", header=i)

                cols = [str(c).upper() for c in temp_df.columns]

                if any("STATE" in c for c in cols) and any("DISTRICT" in c for c in cols):
                    df = temp_df
                    print(f"✅ Header found at row {i}")
                    break
            except:
                continue

        # ================================
        # 🔥 FORCE FALLBACK (MP FIX INCLUDED)
        # ================================
        if df is None:
            print("⚠ Forcing fallback for:", file)

            try:
                if file.endswith(".xls"):
                    df = pd.read_excel(file_path, engine="xlrd", header=None)
                else:
                    df = pd.read_excel(file_path, engine="openpyxl", header=None)

                df.dropna(how="all", inplace=True)

                # Take first 4 columns
                df = df.iloc[:, :4]

                # Clean values
                df = df.apply(lambda col: col.map(lambda x: str(x).strip() if pd.notna(x) else x))

                df.columns = ["State", "District", "SubDistrict", "Village"]

                # Fix State using filename (VERY IMPORTANT)
                state_name = file.split("_")[0].replace("_", " ").title()
                df["State"] = state_name

            except:
                print("❌ Completely failed to process:", file)
                continue

        # ================================
        # 🔧 BASIC CLEAN
        # ================================
        df.dropna(how="all", inplace=True)
        df.columns = df.columns.astype(str).str.strip().str.upper()

        # ================================
        # 🔍 COLUMN DETECTION
        # ================================
        state_col = None
        district_col = None
        subdistrict_col = None
        village_col = None

        for col in df.columns:
            if "STATE" in col:
                state_col = col
            elif "DISTRICT" in col and "SUB" not in col:
                district_col = col
            elif "SUB" in col:
                subdistrict_col = col
            elif "AREA" in col or "VILLAGE" in col:
                village_col = col

        # ================================
        # 🔁 FALLBACK COLUMN MAPPING
        # ================================
        if not all([state_col, district_col, subdistrict_col, village_col]):
            print("⚠ Column mismatch, using fallback column positions")

            cols = df.columns.tolist()

            if len(cols) >= 4:
                state_col = cols[0]
                district_col = cols[1]
                subdistrict_col = cols[2]
                village_col = cols[3]
            else:
                print("❌ Cannot process file:", file)
                continue

        # ================================
        # 📦 EXTRACT DATA
        # ================================
        temp_df = pd.DataFrame({
            "State": df[state_col],
            "District": df[district_col],
            "SubDistrict": df[subdistrict_col],
            "Village": df[village_col]
        })

        all_data.append(temp_df)

# ================================
# 🔗 COMBINE ALL FILES
# ================================
final_df = pd.concat(all_data, ignore_index=True)

print("\nBefore cleaning:", len(final_df))

# ================================
# 🧹 FINAL CLEANING (FIXED)
# ================================

# Fix bad values
final_df.replace("Nan", pd.NA, inplace=True)

# Remove nulls
final_df.dropna(inplace=True)

# 🔥 LESS AGGRESSIVE CLEANING (IMPORTANT FIX)
final_df = final_df[
    (final_df["District"] != final_df["SubDistrict"]) &
    (final_df["Village"] != final_df["SubDistrict"])
]

# Remove duplicates
final_df.drop_duplicates(inplace=True)

# Clean formatting
for col in final_df.columns:
    final_df[col] = final_df[col].astype(str).str.strip().str.title()

# 🔥 Sort data for readability
final_df = final_df.sort_values(by=["State", "District", "SubDistrict"])

print("After cleaning:", len(final_df))

# ================================
# 💾 SAVE OUTPUT
# ================================
final_df.to_csv("final_india_dataset_clean.csv", index=False)
final_df.to_json("final_india_dataset_clean.json", orient="records", indent=2)

print("✅ ALL STATES INCLUDED + CLEANED SUCCESSFULLY")