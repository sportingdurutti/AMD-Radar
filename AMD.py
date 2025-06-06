import pandas as pd

file_excel_path = r"C:\Projects\AMD_Radar\docs\AMD_Radar.xlsx"

df = pd.read_excel(file_excel_path, sheet_name='AMD_Radar_PT', header=0)

# Define file path
file_csv_path = r"C:\Projects\AMD_Radar\docs\AMD_Radar.csv"

df.to_csv(file_csv_path, index=False)

# Load the data using semicolon as separator
data = pd.read_csv(file_csv_path, delimiter=",")
data["name"] = data["name"].str.replace("\n", "<br>")
data["ring"] = data["ring"].str.replace("\n", "<br>")
data["quadrant"] = data["quadrant"].str.replace("\n", "<br>")
# data["isNew"] = data["isNew"].str.replace("\n", "<br>")
data["status"] = data["status"].str.replace("\n", "<br>")
data["description"] = data["description"].str.replace("\n", "<br>")

file_final_csv_path = r"C:\Projects\AMD_Radar\docs\AMD_Radar_vf.csv"

# Save with updated formatting: comma separator and all fields enclosed in quotes
output_path = file_final_csv_path
data.to_csv(output_path, sep=",", quoting=1, index=False)
