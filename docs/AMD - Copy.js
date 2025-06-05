
function listofTags(entries) {
    const rawValues = entries.map(e => e.tag);
    const splitValues = rawValues.flatMap(val =>
        val ? val.split(/\r?\n/) : []
    );

    const uniqueTags = Array.from(
        new Set(splitValues.map(tag => tag.trim()).filter(Boolean))
    );

    // Optional: sort
    uniqueTags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const container = document.getElementById("tagDisplay");
    container.innerHTML = "";

    uniqueTags.forEach(tag => {
        const el = document.createElement("div");
        el.className = "tag";
        el.textContent = tag;

        el.addEventListener("click", () => {
            el.classList.toggle("selected");

            const isSelected = el.classList.contains("selected");
            const tagName = el.textContent;

            filterRadar();
            const selectedTags = Array.from(
                document.querySelectorAll('.tag-container .tag.selected')
            ).map(tagEl => tagEl.textContent);

        });

        container.appendChild(el);
    });
}
function listofTags_Listbox(entries) {
    // Step 1: Get all multiline 'Tags' fields
    const rawValues = entries.map(e => e.tag); // change 'Tags' to your column name
 
    // Step 2: Split each value on \r?\n (Alt+Enter, \n, \r) and flatten
    const splitValues = rawValues.flatMap(val => 
        val ? val.split(/\r?\n/) : []  // avoid null/undefined
    );

    // Step 3: Remove empty strings and duplicates
    const uniqueTags = Array.from(new Set(splitValues.map(tag => tag.trim()).filter(Boolean)));

    uniqueTags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    // Example: populate a <select id="tagList">
    const listbox = document.getElementById("RaceDropDown");
    var el = document.createElement("option");
    el.textContent = "Todos";
    el.value = "Todos";
    listbox.appendChild(el);
    uniqueTags.forEach(tag => {
        const opt = document.createElement("option");
        opt.textContent = tag;
        opt.value = tag;
        listbox.appendChild(opt);
    });
}
function listofTags_old(set) 
{
    alert(lines(set));
    var array = set;
    var unique = [];
    var distinct = [];
    for( let i = 0; i < array.length; i++ )    
    {
        if( !unique[array[i].tag])
        {
            distinct.push(array[i].tag);
            unique[array[i].tag] = 1;
        }
    }
    var d = document.getElementById("listOfFlags");
    var select = document.getElementById('RaceDropDown');
    var el = document.createElement("option");
    el.textContent = "Todos";
    el.value = "Todos";
    select.appendChild(el);
    for (i = 0; i < distinct.length; i++) 
    {
        var opt = distinct[i];
        var el = document.createElement("option");
        el.textContent = opt;
        el.value = opt;
        select.appendChild(el);
    }
 }

 function filterRadar() {
    // 1. Get selected pills (tags)
    const selectedTags = Array.from(
        document.querySelectorAll('.tag-container .tag.selected')
    ).map(tagEl => tagEl.textContent);

    // 2. Clear radar content
    let radarSvg = document.getElementById("radar");
    radarSvg.innerHTML = "";

    // 3. Reload and filter CSV
    fetch('./AMD_Radar_vf.csv')
        .then(resp => resp.text())
        .then(csv => {
            const entries = d3.csvParse(csv, row => toEntry(row));

            if (selectedTags.length === 0) {
                // No selection — show full radar
                //draw_radar(entries);
                return;
            }

            // 4. Filter entries based on matching at least one tag
            const filtered_entries = entries.filter(entry => {
                const entryTags = entry.tag
                    ? entry.tag.split(/\r?\n/).map(t => t.trim())
                    : [];

                return selectedTags.some(tag => entryTags.includes(tag));
            });

            draw_quadrant(filtered_entries);
        });
}

function filterRadar1() 
{
    let index = document.getElementById("RaceDropDown").value;
    var d = document.getElementById("radar");
    d.innerHTML = "";
    fetch('./AMD_Radar_vf.csv')
        .then(function (resp) 
        {
            return resp.text();
        })
        .then(function (csv) 
        {
            var entries = d3.csvParse(csv, function (row) 
            {
                return toEntry(row);
            });
            var filtered_entries =  entries.filter(function(entry) 
            {
                return entry.tag === index;
            });
            if (index == "Todos")
            {
                draw_radar(entries);
            }
            else
            {
                draw_quadrant(filtered_entries);
            }
        });
}

function showpanel(d) 
{
    document.getElementById("Name").innerHTML = d.label;
    document.getElementById("Description").innerHTML= d.description;
}

function hidepanel() 
{
    document.getElementById("Name").innerHTML = "";
    document.getElementById("Description").innerHTML= "";
}
