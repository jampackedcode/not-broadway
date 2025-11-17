import * as fs from 'fs';

const htmlContent = `
<h1 class="wp-block-heading">New York Theaters</h1>
<h3 class="wp-block-heading"><a href="https://54below.org/support/" data-type="link" data-id="https://54below.org/support/" target="_blank" rel="noreferrer noopener">54 Below</a><br><a href="http://abingdontheatre.org/category/support/" target="_blank" rel="noreferrer noopener"><br>Abingdon Theatre Company</a></h3>

<h3 class="wp-block-heading"><a href="http://www.abronsartscenter.org/donate/" target="_blank" rel="noreferrer noopener">Abrons Arts Center</a></h3>
<h3 class="wp-block-heading"><a href="http://www.accesstheater.com/copy-of-contact" target="_blank" rel="noreferrer noopener">Access Theater</a></h3>
<h3 class="wp-block-heading"><a href="http://www.adjustedrealists.com/" target="_blank" rel="noreferrer noopener">Adjusted Realists</a></h3>
<h3 class="wp-block-heading"><a href="http://www.aeny-elpuente.org/support-aeny/contribute/" target="_blank" rel="noreferrer noopener">AENY – Spanish Artists in New York</a></h3>
<h3 class="wp-block-heading"><a rel="noreferrer noopener" href="https://allforonetheater.secure.force.com/donate/?dfId=a0nF0000005Gq82IAC" target="_blank">All For One Theater</a></h3>
<h3 class="wp-block-heading"><a rel="noreferrer noopener" href="http://www.americantheatreofactors.com/" target="_blank">American Theatre of Actors</a></h3>
<h3 class="wp-block-heading"><a href="https://www.apollotheater.org/donate/?_ga=2.133877198.156320818.1638277959-120147870.1638277959" target="_blank" rel="noreferrer noopener">*Apollo Theater</a></h3>
<h3 class="wp-block-heading"><a href="http://aquilatheatre.com/" target="_blank" rel="noreferrer noopener">Aquila Theatre Company</a></h3>
<h3 class="wp-block-heading">*<a href="http://arsnovanyc.com/support_us" target="_blank" rel="noreferrer noopener">Ars Nova</a></h3>
<h3 class="wp-block-heading"><a href="http://www.artforprogress.org/" target="_blank" rel="noreferrer noopener">Art for Progress</a></h3>
<h3 class="wp-block-heading"><a href="http://www.apacny.org/" target="_blank" rel="noreferrer noopener">Astoria Performing Arts Center</a></h3>
<h3 class="wp-block-heading"><a href="http://www.athenatheatre.com/" target="_blank" rel="noreferrer noopener">Athena Theatre Company</a></h3>
<h3 class="wp-block-heading"><a href="https://atlantictheater.org/support/donate/" data-type="link" data-id="https://atlantictheater.org/support/donate/">Atlantic Theater Company</a></h3>
<h3 class="wp-block-heading"><a href="http://www.atticist.co.uk/" target="_blank" rel="noreferrer noopener">Atticist</a></h3>
<h3 class="wp-block-heading">*<a href="http://www.bam.org/" target="_blank" rel="noreferrer noopener">BAM</a></h3>



<h3 class="wp-block-heading"><a href="http://www.batedbreaththeatre.org/" target="_blank" rel="noreferrer noopener">Bated Breath Theatre Company</a></h3>



<h3 class="wp-block-heading"><a href="https://bedlam.org/support/" target="_blank" rel="noreferrer noopener">*BEDLAM</a></h3>



<h3 class="wp-block-heading"><a rel="noreferrer noopener" href="http://boomerangtheatre.jimdo.com/home/" target="_blank">Boomerang Theater Company</a></h3>



<p><strong><a href="http://boundlesstheatre.org/" target="_blank" rel="noreferrer noopener">Boundless Theatre Company</a></strong></p>



<h3 class="wp-block-heading"><a href="http://braveartistcollective.com/" target="_blank" rel="noreferrer noopener">Brave Artist Collective Theater Company</a></h3>



<h3 class="wp-block-heading"><a href="https://ci.ovationtix.com/122/store/donations/365" data-type="link" data-id="https://ci.ovationtix.com/122/store/donations/365" target="_blank" rel="noreferrer noopener">Brick Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://www.brierpatchproductions.com/" target="_blank" rel="noreferrer noopener">Brierpatch Productions</a></h3>



<h3 class="wp-block-heading"><a href="http://www.classicstage.org/support/donate/" target="_blank" rel="noreferrer noopener">Classic Stage Company</a></h3>



<h3 class="wp-block-heading"><a rel="noreferrer noopener" href="https://www.cthnyc.org" target="_blank">*Classical Theatre of Harlem</a></h3>



<h3 class="wp-block-heading"><a href="http://companyxiv.com/" target="_blank" rel="noreferrer noopener">Company XIV</a></h3>



<h3 class="wp-block-heading"><a href="https://www.convergencescollective.org/" target="_blank" rel="noreferrer noopener">Convergences Theatre Collective</a></h3>



<h3 class="wp-block-heading"><a href="https://corkscrewfestival.org/" target="_blank" rel="noreferrer noopener">Corkscrew Theater Festival</a></h3>



<h3 class="wp-block-heading"><a href="http://cultureproject.org/contribute/" target="_blank" rel="noreferrer noopener">Culture Project</a></h3>



<h3 class="wp-block-heading"><a href="https://departmentoffools.wordpress.com/" target="_blank" rel="noreferrer noopener">Department of Fools</a></h3>



<h3 class="wp-block-heading"><a href="http://dutchkillstheater.com/" target="_blank" rel="noreferrer noopener">Dutch Kills Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://elephantrundistrict.org/" target="_blank" rel="noreferrer noopener">Elephant Run District</a></h3>



<h3 class="wp-block-heading"><a href="https://www.elevator.org" target="_blank" rel="noreferrer noopener">*Elevator Repair Service</a></h3>



<h3 class="wp-block-heading"><a href="https://engardearts.org/support/" target="_blank" rel="noreferrer noopener">*En Garde Arts</a></h3>



<h3 class="wp-block-heading"><a href="http://www.ensemblestudiotheatre.org/donate/" target="_blank" rel="noreferrer noopener">Ensemble Studio Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://www.fluxtheatre.org/give/" target="_blank" rel="noreferrer noopener">Flux Theatre Ensemble</a></h3>



<h3 class="wp-block-heading"><a href="http://www.horsetrade.info/donate" target="_blank" rel="noreferrer noopener">FRIGID New York @ Horse Trade</a></h3>



<h3 class="wp-block-heading"><a href="http://frogandpeachtheatre.org/" target="_blank" rel="noreferrer noopener">Frog and Peach Theatre Company</a></h3>



<h3 class="wp-block-heading"><a href="http://fusiontheatresite.wixsite.com/home" target="_blank" rel="noreferrer noopener">Fusion Theater Company</a></h3>



<h3 class="wp-block-heading"><a href="http://www.group.br.com/events-crowdfunding-campaign" target="_blank" rel="noreferrer noopener">Group.BR</a></h3>



<h3 class="wp-block-heading"><a href="http://www.harlemrepertorytheatre.com/" target="_blank" rel="noreferrer noopener">Harlem Repertory Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://www.here.org/support/support-here" target="_blank" rel="noreferrer noopener">*HERE Arts Center</a></h3>



<h3 class="wp-block-heading"><a href="http://www.iatitheater.org/involved" target="_blank" rel="noreferrer noopener">IATI Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://www.intartheatre.org/" target="_blank" rel="noreferrer noopener">INTAR Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://inviolettheater.com/" target="_blank" rel="noreferrer noopener">InViolet Theater</a></h3>



<h3 class="wp-block-heading"><a href="https://web.ovationtix.com/trs/store/32325/alldonations/25603?_ga=2.200801006.1576886880.1543288602-104588329.1538283187" target="_blank" rel="noreferrer noopener">*Irish Rep</a></h3>



<h3 class="wp-block-heading"><a href="http://irondale.org/" target="_blank" rel="noreferrer noopener">*Irondale Ensemble</a></h3>



<h3 class="wp-block-heading"><a href="http://irttheater.org/" target="_blank" rel="noreferrer noopener">iRT Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://www.jackny.org/" target="_blank" rel="noreferrer noopener">JACK</a><br></h3>



<h3 class="wp-block-heading"><a href="https://livingtraditions.app.neoncrm.com/np/clients/livingtraditions/donation.jsp?campaign=10&amp;" data-type="link" data-id="https://livingtraditions.app.neoncrm.com/np/clients/livingtraditions/donation.jsp?campaign=10&amp;" target="_blank" rel="noreferrer noopener">Jalopy Theate</a></h3>



<h3 class="wp-block-heading"><a href="http://www.jdbpacnyc.org/" target="_blank" rel="noreferrer noopener">Julia de Burgos Performance and Arts Center</a></h3>



<h3 class="wp-block-heading"><a href="http://www.keencompany.org/donate/" target="_blank" rel="noreferrer noopener">Keen Company</a></h3>



<h3 class="wp-block-heading"><a href="http://lamama.org/donate/" target="_blank" rel="noreferrer noopener">La MaMa ETC</a></h3>



<h3 class="wp-block-heading"><a href="http://www.lesseramerica.com/" target="_blank" rel="noreferrer noopener">Lesser America</a></h3>



<h3 class="wp-block-heading"><a href="http://www.lct.org/support/" target="_blank" rel="noreferrer noopener">*Lincoln Center Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://www.lockedintheatticproductions.com/" target="_blank" rel="noreferrer noopener">Locked In The Attic Productions</a></h3>



<h3 class="wp-block-heading"><a href="http://www.manhattantheatreclub.com/" target="_blank" rel="noreferrer noopener">*Manhattan Theatre Club</a></h3>



<h3 class="wp-block-heading"><a href="http://ma-yitheatre.org/" target="_blank" rel="noreferrer noopener">*Ma-Yi Theater Company</a></h3>



<h3 class="wp-block-heading">*<a href="http://www.mcctheater.org/supportus/patronprogram.html" target="_blank" rel="noreferrer noopener">MCC Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://www.medicineshowtheatre.org/" target="_blank" rel="noreferrer noopener">Medicine Show Theatre Ensemble</a></h3>



<h3 class="wp-block-heading"><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&amp;business=connect%40metropolitanplayhouse%2eorg&amp;item_name=Metropolitan%20Playhouse&amp;no_shipping=0&amp;no_note=1&amp;tax=0&amp;currency_code=USD&amp;lc=US&amp;bn=PP%2dDonationsBF&amp;charset=UTF%2d8" target="_blank" rel="noreferrer noopener">Metropolitan Playhouse</a></h3>



<h3 class="wp-block-heading"><a href="http://minttheater.org/make-an-investmint/" target="_blank" rel="noreferrer noopener">*Mint Theater Company</a></h3>



<h3 class="wp-block-heading"><a href="http://www.nationalblacktheatre.org/donate" target="_blank" rel="noreferrer noopener">National Black Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://nytf.org/donate/" target="_blank" rel="noreferrer noopener">National Yiddish Theatre Folksbiene</a></h3>



<h3 class="wp-block-heading"><a href="http://necinc.org/" target="_blank" rel="noreferrer noopener">Negro Ensemble Company</a></h3>



<h3 class="wp-block-heading"><a href="http://www.newfederaltheatre.com/support" target="_blank" rel="noreferrer noopener">New Federal Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://www.newlighttheaterproject.com/donate" target="_blank" rel="noreferrer noopener">New Light Theater Project</a></h3>



<h3 class="wp-block-heading">*<a href="http://www.nycitycenter.org/Home" target="_blank" rel="noreferrer noopener">New York City Center</a></h3>



<h3 class="wp-block-heading"><a href="http://www.nyneofuturists.org/" target="_blank" rel="noreferrer noopener">New York Neo-Futurists</a></h3>



<h3 class="wp-block-heading"><a href="http://www.newyorkrep.org/" target="_blank" rel="noreferrer noopener">NewYorkRep</a></h3>



<h3 class="wp-block-heading"><a href="http://www.nytw.org/" target="_blank" rel="noreferrer noopener">*New York Theatre Workshop</a></h3>




<h3 class="wp-block-heading"><a href="http://www.page73.org/give/" target="_blank" rel="noreferrer noopener">Page 73 Productions</a></h3>



<h3 class="wp-block-heading"><a href="http://www.paradisefactory.org/" target="_blank" rel="noreferrer noopener">Paradise Factory Theater</a></h3>



<h2 class="wp-block-heading"><a href="http://www.armoryonpark.org/" target="_blank" rel="noreferrer noopener">*Park Avenue Armory</a></h2>



<h3 class="wp-block-heading"><a href="https://www.networkforgood.org/donation/ExpressDonation.aspx?ORGID2=13-4089362&amp;vlrStratCode=YPnhsCv%2bVNA%2bLNb%2fmr%2bjxmxlSeCrUSuZd7v0simbtvDOWnMJ7q3yFh4qJ23jPgsv" data-type="link" data-id="https://www.networkforgood.org/donation/ExpressDonation.aspx?ORGID2=13-4089362&amp;vlrStratCode=YPnhsCv%2bVNA%2bLNb%2fmr%2bjxmxlSeCrUSuZd7v0simbtvDOWnMJ7q3yFh4qJ23jPgsv" target="_blank" rel="noreferrer noopener">Peculiar Works Project</a></h3>



<h3 class="wp-block-heading"><a href="http://www.penguinrep.org/" target="_blank" rel="noreferrer noopener">Penguin Repertory Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://pipelinetheatre.org/" target="_blank" rel="noreferrer noopener">Pipeline Theatre Company</a>P</h3>



<h3 class="wp-block-heading"><a href="http://www.theplayerstheatre.com/" target="_blank" rel="noreferrer noopener">Players Theatre</a></h3>



<h3 class="wp-block-heading">*<a href="http://www.playwrightshorizons.org/" target="_blank" rel="noreferrer noopener">Playwrights Horizons</a></h3>



<h3 class="wp-block-heading"><a href="http://pregonesprtt.org/you/donate/" target="_blank" rel="noreferrer noopener">*Pregones + Puerto Rican Traveling Theater</a></h3>



<h3 class="wp-block-heading"><a href="https://primarystages.secure.force.com/donate/?dfId=a10A000000ThgFYIAZ" target="_blank" rel="noreferrer noopener">Primary Stages</a></h3>



<h3 class="wp-block-heading"><a href="http://www.projectytheatre.org/" target="_blank" rel="noreferrer noopener">Project Y Theatre Company</a></h3>



<h3 class="wp-block-heading"><a href="https://publictheater.org/en/support/donate-now/?code=fb&amp;src=39864" target="_blank" rel="noreferrer noopener">*The Public Theater/New York Shakespeare Festival</a></h3>



<h3 class="wp-block-heading"><a href="http://www.queensshakespeare.com/" target="_blank" rel="noreferrer noopener">Queens Shakespeare</a></h3>



<h3 class="wp-block-heading"><a href="http://www.radiotheatrenyc.com/" target="_blank" rel="noreferrer noopener">Radiotheatre NYC</a></h3>



<h3 class="wp-block-heading"><a href="http://randomaccesstheatre.com/" target="_blank" rel="noreferrer noopener">Random Access Theatre</a></h3>



<h3 class="wp-block-heading">*<a href="http://www.rattlestick.org/support_us/" target="_blank" rel="noreferrer noopener">Rattlestick Playwrights Theater</a></h3>



<h3 class="wp-block-heading"><a href="https://web.ovationtix.com/trs/store/2722/alldonations/24291" target="_blank" rel="noreferrer noopener">Red Bull Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://repertorio.nyc/#/donate" target="_blank" rel="noreferrer noopener">Repertorio Español</a></h3>



<h3 class="wp-block-heading"><a href="https://www.roundabouttheatre.org/" target="_blank" rel="noreferrer noopener">*Roundabout Theatre Company</a></h3>



<h3 class="wp-block-heading"><a href="http://2st.com/support-us" target="_blank" rel="noreferrer noopener">Second Stage Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://sheencenter.org/" target="_blank" rel="noreferrer noopener">Sheen Center</a></h3>



<h3 class="wp-block-heading"><a href="http://www.signaturetheatre.org/" target="_blank" rel="noreferrer noopener">Signature Theatre Company</a></h3>



<h3 class="wp-block-heading"><a href="http://siti.org/" target="_blank" rel="noreferrer noopener">SITI Company</a></h3>



<h3 class="wp-block-heading"><a href="https://red.vendini.com/donation-software.html?d=dec967f1bb41ba25e14dc479927a7f84&amp;t=donation" target="_blank" rel="noreferrer noopener">SoHo Playhouse</a></h3>



<h3 class="wp-block-heading"><a href="http://sohorep.org/support/donate" target="_blank" rel="noreferrer noopener">*Soho Rep</a></h3>



<h3 class="wp-block-heading"><a href="http://www.superheroclubhouse.org/" target="_blank" rel="noreferrer noopener">Superhero Clubhouse</a></h3>



<h3 class="wp-block-heading"><a href="http://tactnyc.org/support/" target="_blank" rel="noreferrer noopener">TACT NY</a></h3>



<h3 class="wp-block-heading"><a href="https://www.targetmargin.org" target="_blank" rel="noreferrer noopener">*Target Margin Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://www.nycharities.org/donate/c_donate.asp?CharityCode=2115" target="_blank" rel="noreferrer noopener">Teatro SEA</a></h3>



<h3 class="wp-block-heading"><a href="http://tectonictheaterproject.org/" target="_blank" rel="noreferrer noopener">*Tectonic Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://theactorsstudio.org/" target="_blank" rel="noreferrer noopener">The Actors Studio</a></h3>



<h3 class="wp-block-heading"><a href="http://www.tbtb.org/" target="_blank" rel="noreferrer noopener">Theater Breaking Through Barriers</a></h3>



<h3 class="wp-block-heading"><a href="http://www.theaterforthenewcity.net/donation.htm" target="_blank" rel="noreferrer noopener">*Theater for the New City</a></h3>



<h3 class="wp-block-heading"><a href="https://newyorktheater.me/2021/11/29/sondheim-the-mourning-after-stageworthynews/" target="_blank" rel="noreferrer noopener">Theater of the Oppressed</a></h3>



<h2 class="wp-block-heading"><a href="http://www.theaterlabnyc.com/" target="_blank" rel="noreferrer noopener">Theaterlab</a></h2>



<h2 class="wp-block-heading"><a href="https://theatermitu.org/support/" data-type="link" data-id="https://theatermitu.org/support/" target="_blank" rel="noreferrer noopener">Theater Mitu</a></h2>



<h3 class="wp-block-heading"><a href="http://www.tfana.org/support" target="_blank" rel="noreferrer noopener">Theatre for a New Audience</a></h3>



<h3 class="wp-block-heading">*<a href="http://thebillieholiday.org/" target="_blank" rel="noreferrer noopener">The Billie Holiday Theatre</a></h3>



<h3 class="wp-block-heading"><a href="http://web.ovationtix.com/trs/store/122/alldonations/365" target="_blank" rel="noreferrer noopener">The Brick</a></h3>



<h2 class="wp-block-heading"><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=MXKAK9FLGKCTU" target="_blank" rel="noreferrer noopener">The Cell Theatre</a></h2>


<h3 class="wp-block-heading"><a href="https://web.ovationtix.com/trs/store/14/donate/285" target="_blank" rel="noreferrer noopener">The Flea Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://thepit-nyc.com/" target="_blank" rel="noreferrer noopener">The Peoples Improv Theater</a></h3>



<h3 class="wp-block-heading"><a href="http://www.playwrightsrealm.org/donate/" target="_blank" rel="noreferrer noopener">The Playwrights Realm</a></h3>



<h3 class="wp-block-heading"><a href="http://www.secrettheatre.com/" target="_blank" rel="noreferrer noopener">The Secret Theatre</a></h3>



<h3 class="wp-block-heading">*<a href="https://thetanknyc.org/support" target="_blank" rel="noreferrer noopener">The Tank</a></h3>



<h3 class="wp-block-heading"><a href="http://www.yorktheatre.org/make-a-donation.html" target="_blank" rel="noreferrer noopener">The York Theatre Company</a></h3>



<h3 class="wp-block-heading"><a href="https://fundraising.fracturedatlas.org/third-rail-projects" target="_blank" rel="noreferrer noopener">Third Rail Projects</a></h3>



<h3 class="wp-block-heading"><a href="http://transportgroup.org/" target="_blank" rel="noreferrer noopener">Transport Group</a></h3>
<h3 class="wp-block-heading"><a href="http://tschreiber.org/" target="_blank" rel="noreferrer noopener">T. Schreiber Theatre</a></h3>
<h3 class="wp-block-heading"><a href="http://www.untitledtheater.com/" target="_blank" rel="noreferrer noopener">Untitled Theater Company #61</a></h3>
<h3 class="wp-block-heading"><a href="http://urbanstages.org/support/" target="_blank" rel="noreferrer noopener">Urban Stages</a></h3>
<h3 class="wp-block-heading"><a href="http://www.vineyardtheatre.org/support/making-your-gift/" target="_blank" rel="noreferrer noopener">*Vineyard Theatre</a></h3>
<h3 class="wp-block-heading"><a href="https://waterwell.funraise.org/" target="_blank" rel="noreferrer noopener">Waterwell</a></h3>
<h3 class="wp-block-heading"><a href="https://www.wwtns.org/" target="_blank" rel="noreferrer noopener">What Will the Neighbors Say?</a></h3>
<h3 class="wp-block-heading"><a href="http://wptheater.org/" target="_blank" rel="noreferrer noopener">WP Theater</a></h3>
`;

interface Theater {
  url: string;
  name: string;
}

// Extract theaters from HTML
function parseTheaters(html: string): Theater[] {
  const theaters: Theater[] = [];

  // Regular expression to match <a> tags with href and text content
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi;

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    let name = match[2];

    // Remove HTML tags from the name
    name = name.replace(/<[^>]*>/g, '');

    // Clean up the name: remove leading/trailing whitespace and asterisks
    name = name.trim().replace(/^\*/, '').trim();

    // Skip empty names
    if (!name) {
      continue;
    }

    theaters.push({ url, name });
  }

  return theaters;
}

// Convert to CSV
function toCSV(theaters: Theater[]): string {
  const rows = theaters.map(theater => {
    // Escape quotes in the name
    const escapedName = theater.name.replace(/"/g, '""');
    return `"${theater.url}","${escapedName}"`;
  });

  return rows.join('\n');
}

// Main execution
const theaters = parseTheaters(htmlContent);
const csv = toCSV(theaters);

// Write to file
fs.writeFileSync('theaters.csv', csv);

console.log(`Extracted ${theaters.length} theaters to theaters.csv`);
console.log('\nFirst 5 entries:');
theaters.slice(0, 5).forEach(t => {
  console.log(`"${t.url}","${t.name}"`);
});
