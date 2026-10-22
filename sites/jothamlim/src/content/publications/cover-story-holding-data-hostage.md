---
title: "Cover Story: Holding Data Hostage"
date: 2021-08-08
updated: 2026-10-03T16:29:27+00:00
outlet: the-edge
seo:
  canonical: https://theedgemalaysia.com/node/579460
---

This article first appeared in Digital Edge, The Edge Malaysia Weekly on August 9, 2021 - August 15, 2021

Ransomware is a present-day digital plague — cold, methodical and indifferent. Spreading from source to source, it can lie dormant within networks for years, biding its time before striking.

In a flash, it encrypts all data it comes in contact with, holding hostage decades’ worth of scientific research, crucial medical records or countless baby photos. Unlike the biblical plagues of Moses, the almighty hacker sends forth an avaricious Pharaoh days before data annihilation. “Pay us, and we will let your data go.”

Local testimonials of ransomware attacks are hard to come by, owing to the lack of breach notification laws in Malaysia, with victims preferring to keep these incidents under wraps. However, local penetration testing firm LE Global Services Sdn Bhd (LGMS) receives about two to three such incident reports a month and stumbles upon unique cases from time to time.

“There was an incident back in March, and we remember the case clearly because it involved a financial institution. During the digital forensic investigation, we realised that the hackers had infiltrated the network back in 2018. They had access [to the network] for more than three years,” says LGMS CEO Fong Choong Fook.

“This was not the scariest part. We found another batch of hackers who had infiltrated the network just recently in January this year. Both groups were doing their separate things, and it was the latter group that launched the ransomware [attack].

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-Fong-tem1378_theedgemarkets.jpg)

"When they launch ransomware attacks, we assume that it is already their last resort because the victim has the option to pay or not to pay.” - Fong

“Imagine if the January batch of hackers had not alerted the institution through the ransomware attack, but instead followed the 2018 batch’s lead by hiding quietly and illegally accessing information. Until today, the financial institution would probably not be aware of their existence.”

Another case also involved a financial institution, but the hacker had gained access to the network for more than five years. Resolving this case was extremely challenging. While Fong’s team was conducting digital forensics, the client was also deploying several other vendors to help with the investigation, which proved to be more troublesome than helpful.

When these vendors deployed their solutions into the network, Fong’s team identified these movements as new threats, making it harder to isolate the movements of the ransomware hackers. Some of the tools deployed even overwrote the traces left by the hackers, and the team was slowly losing evidence. Fong had to ask the client to stop immediately whatever it was doing, until the team managed to get the evidence it needed.

When the team reverse-engineered and tore the ransomware apart, they found fixed IP addresses of the client’s network being hardcoded inside the ransomware itself. The ransomware was also designed to bypass the specific antivirus software used by the client, suggesting that the hackers had spent time and effort customising the ransomware to suit the victim’s IT environment.

Fong suspects that this could be an inside job, but lacked the evidence to pinpoint the culprit. Five years is more than enough time for hackers to cover their tracks, he adds.

Both incidents have one commonality — hackers gaining access to the victim’s network long before the ransomware attack was initiated. As lucrative as ransomware may seem, Fong explains that it is supposed to be the last resort in the hacker’s toolkit.

He explains that gaining access to the business’ networks is much more desirable, as it opens up more opportunities for hackers. An example would be hijacking the victim’s business email communications, masquerading as them to siphon money from suppliers and customers.

“This kind of business model is much more solid for hackers, because they know for sure that they will get their money. But when they launch ransomware attacks, we assume that it is already their last resort because the victim has the option to pay or not pay,” he says.

“It’s also very rare for hackers to successfully hack into a network and launch a ransomware attack right away. They need to conduct lateral movements and identify the valuable targets, because there’s little point infecting only one or two machines.”

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-digitionary-tem1378_theedgemarkets.jpg)

## No one is safe

News headlines reinforce the optics that ransomware attacks are rare encounters reserved for large institutions flush with cash. Prolific victims include billion-dollar corporations such as Acer, JBS Foods and Colonial Pipelines. Local news media have reported attacks on companies such as Media Prima and AXA’s Asia Assistance division.

However, the evidence indicates otherwise. Sophos’ “The State of Ransomware 2021 Report” states that 33% of organisations with between 100 and 1,000 employees were hit with ransomware attacks last year, compared with 42% from larger organisations. Attacks are indiscriminate, but leaning towards the retail and education sectors, with 44% of respondents in both sectors reportedly being hit. The survey involved 5,400 IT managers in mid-sized organisations in 30 countries worldwide.

If treated as a business expense, ransomware attacks are extortionate cost centres with seemingly no cap limit. The average total remediation cost for attacks have more than doubled from about US$760,000 last year to US$1.85 million (RM7.8 million) this year.

Worst of all, many organisations are confident that they will not be hit by ransomware attacks, because they have supposedly well-trained IT personnel.

Sophos Malaysia country manager Wong Joon Hoong explains that it is risky to follow this line of thinking. “While trained IT staff will help identify some of the tell-tale signs of ransomware attacks, it would not necessarily protect you,” he says.

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-Wong-tem1378_theedgemarkets.jpg)

"If you do decide to pay, bear in mind that the adversaries will restore, on average, only two-thirds of your files.” - Wong

“This is a cause for concern because, globally, 55% of respondents who do not expect to be hit are putting their faith in approaches that do not offer any protection from ransomware [attacks].”

The two approaches cited by survey respondents are air-gapped backups and cybersecurity insurance. While both measures are valuable tools in restoring data and dealing with the aftermath, they do not prevent attacks from happening in the first place.

In fact, there are also risks involved in being entirely reliant on backups as a method to deal with ransomware attacks, says Lim Suk Hua, country manager of Palo Alto Networks Malaysia.

“A common practice we have seen is [organisations] being reliant on backups, believing that it does not matter if they get hit. They do not have to pay the ransom and just need to restore the data,” she says.

“First, bear in mind that the data backup [you have] may not be the latest data. Second, how successful is the data restoration process? That is one area organisations need to look into.”

She further stresses that having backups is still an important aspect in dealing with a ransomware attack. However, new ransomware variants, such as the Maze ransomware, can encrypt data that is outside the virtual machine that the ransomware operates in, making data backups and restoration difficult.

This issue is further compounded by the fact that many organisations allow employees to use their personal laptops for everyday work instead of a company-issued laptop with the necessary protection software installed. This exposes the organisation to even more threats, one that backups alone may not be able to resolve.

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-table-tem1378_theedgemarkets.jpg)

Lim advises organisations against paying ransomware hackers, a sentiment shared by Wong and Fong, security experts worldwide and even the US Federal Bureau of Investigation. A common misconception that companies have is that paying the ransom will resolve the issue, and they are able to get all of their data back, says Sophos’ Wong.

“Based on our insights, paying the ransom only gets you some of your data back. We found that, on average, organisations that paid the ransom got back just 65% of encrypted files, which means one-third of their files are still inaccessible,” he explains.

“Don’t pay the ransom — easy to say, but far less easy to do when your organisation has ground to a halt because of a ransomware attack. Independent of any ethical considerations, paying the ransom is an ineffective way to get data back. If you do decide to pay, bear in mind that the adversaries will restore, on average, only two-thirds of your files.”

## Need for ransomware negotiation

Despite calls not to pay the ransom, organisations with no course for remediation are compelled to do so, giving rise to a new category of experts known as “ransomware negotiators”. One of them is Kurtis Minder, CEO of US-based cyber reconnaissance company GroupSense.

“While the logic for such a policy [of not paying ransom] has its base in disincentivising the criminals, it does not provide an alternative path for the many businesses who may go out of business, or the healthcare institutions where life may be at immediate risk,” Minder tells Digital Edge.

“Negotiators play a critical role in playing mediator between the victim and the ransomware operators. The value we bring to the table is often objectivity, familiarity, operational security, financial facilitation, negotiation skills and, in the case of GroupSense, superior cyber intelligence.”

Minder has served as a conduit between victims and ransomware operators, a role that did not exist a few years ago. Now, negotiators are part of a growing list of approved vendors working with cyber insurance carriers specialising in addressing breaches and ransomware attacks.

His frequent brushes with high-stake situations gave him a better understanding of the people behind these ransomware attacks. He learnt that many ransomware groups are highly structured organisations operating in Russia and Russian-influenced Eastern European states. He says these organisations have processes and reporting structures similar to that of a legitimate business.

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-Minder-tem1378_theedgemarkets.jpg)

"Most of the threat actors have some autonomy and amnesty from the state in which they reside. This emboldens and protects them from accountability.” - Minder

“It is speculative, but evidence suggests that these attacks are purely financially motivated. Of course, most of the threat actors have some autonomy and amnesty from the state in which they reside. This emboldens and protects them from accountability,” he adds.

Despite the various groups of ransomware variants and syndicate structures, Minder says most, if not all, ransomware attacks involve some level of dark web access. The dark web is a hidden collective of internet sites not open to common internet users, and is accessible only by specialised web browsers. At a minimum, this access is used to provide “proof of life” — terminology borrowed from the actual hostage crisis.

“The proof of life shows that, one, they have stolen the data they claim to have and, two, they have the capability to unlock the files that they have locked,” he says.

“It is also typical for the dark web site to provide the communications medium between the victim and the ransomware operators, though this is not always the case. Other times, messaging media, paste sites and anonymous email services are utilised. Bitcoin is also not the only cryptocurrency used for ransom payments. Other currencies, such as Ether, and privacy coins, such as Monero, are also used.”

Minder’s ransomware negotiation services and knowledge of the dark web tie into GroupSense’s core products, which are primarily security-monitoring software. One of its offerings is dark-web monitoring.

Minder says GroupSense was founded seven years ago with a primary focus on monitoring dark web activities, and it eventually expanded into a full-scope digital risk protection services company. The purpose of monitoring the dark web is to search for signs of a breach, data exfiltration, stolen intellectual property, corporate credentials, or indicators of an upcoming attack on an organisation.

“We still do all of these things, and we don’t just provide the warning; we help companies actually solve the problem. The role the dark web often plays in preventing ransomware attacks has to do with initial access brokers,” he says.

“These are threat actors that break into companies and sell the stolen access to the ransomware operators. Detecting this activity can actively prevent an attack from occurring.”

## Ransomware flavour of the month

The 2017 WannaCry incident put ransomware in the public spotlight, even though the threat has existed for decades. WannaCry affected more than 230,000 computers across 150 countries, resulting in an estimated US$4 billion in losses — all within a single week.

A stream of new ransomware variants has sprung up in the years since then. Some are built on top of old ransomware “families”, while others are programmed anew. They were also given hacker-like names, such as Ryuk, Defray777, NetWalker and Hitler.

Developed in 2016, Hitler is one of the older antagonists in the scene. Upon infection, a lock screen image of Adolf Hitler giving a Nazi Salute is displayed. Instead of Bitcoins, it requests €25 worth of mobile phone gift cards.

Contrary to its claims, Hitler does not encrypt the infected computer’s files. When the timer hits zero, the screen flashes the infamous blue screen of death, and data from key folders will be removed upon reboot.

Other ransomware variants are not so forgiving. Dharma is one of the oldest ransomware families being deployed today, first identified publicly in 2016. Its source code is currently up for sale in hacking forums for as little as US$2,000, opening up the malware for customisation, which results in more successful and damaging infections.

While most variants attack systems through standard email phishing tactics, DoppelPaymer does so through fake software updates instead. Once downloaded and executed, secondary malware and tools are then installed in the infected system, such as Process Hacker, which terminates many of the computer’s security services and processes.

None of these variants is as notorious, however, as REvil, short for “ransomware evil”. The ransomware group earned the reputation for exfiltrating massive data sets and demanding multimillion-dollar ransoms. Early in July, it was identified as the party responsible for the attack on JBS Foods, the US’s largest beef producer.

According to the latest report from Unit 42 of Palo Alto Networks, the criminals behind REvil were found to be working with another group known as GandCrab. The GandCrab ransomware is perhaps the most widespread ransomware variant, making up almost half of the variants collected from Unit42’s telemetry. If you were to get hit by an attack, chances are that it involves GandCrab.

REvil is also one of the most prominent providers of ransomware-as-a-service (RaaS). It has built an entire ecosystem — providing adaptable encryptors and decryptors, services for negotiation communications, and even a leak site for publishing stolen data. It takes a percentage of the ransom as its fees.

“REvil and its affiliates pulled in an average payment of US$2.25 million during the first six months of 2021 in the cases that we observed,” the report states.

“When victims fail to meet deadlines for making payments via Bitcoin, the attackers often double the demand. Eventually, they post stolen data on the leak site if the victim does not pay up or enter into negotiations.”

## Ransomware subpractices

Every expert whom Digital Edge has spoken to agrees on one fact — ransomware is prevalent because it has a lucrative business model that can generate a massive amount of money for ransomware operators.

Like all business models, several other subpractices have stemmed from standard ransomware attacks. Their existence serves the sole purpose of making ransomware attacks much deadlier, easier to spread and harder to deal with.

• **Double extortion**

Once attacked, victims generally pay ransomware operators a hefty sum to decrypt the locked files. However, this does not stop ransomware operators from storing a copy of these sensitive files for themselves and leaking them out to the public.

This could result in a practice known as double extortion, where the operators coerce the victim to pay an additional ransom not to have the data leaked. There are currently at least 16 ransomware variants that adopt such a practice, according to “The Ransomware Threat Report 2021” by Palo Alto Networks.

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-Lim-tem1378_theedgemarkets.jpg)

"Besides the financial strain of paying double the ransom, it is also the fact that the data itself will be exposed if it is not being paid for.” - Lim

“This is one of the easiest ways for ransomware hackers to make money, and we foresee more variants following this trend,” says Lim Suk Hua, country manager of Palo Alto Networks Malaysia.

“In cybersecurity, what we are trying to ultimately protect is the data itself. Besides the financial strain of paying double the ransom, it is also the fact that the data itself will be exposed if it is not being paid for. If a data breach is exposed, the impact it brings to the organisation will be even worse.”

Such dangerous tactics have already reached Malaysian shores. There has been one identified case of a Malaysian organisation falling victim to double extortion. Palo Alto Networks’ threat intelligence team, Unit 42, frequently monitors the dark web, and has found leaked information that can be attributed to a Malaysian organisation. There could be more victims that have yet to be uncovered.

• **Ransomware-as-a-service**

“Looking to extort millions of dollars but lack the technical know-how to do so? Syndicates are now offering to lease out ransomware variants for a measly subscription fee! Visit this onion link on the dark web today to get the best prices and discounts!”

Such advertisements are not uncommon within forums on the dark web. A business in the criminal underworld is still a business nonetheless. They have taken a page or two out of the subscription playbook of successful companies such as Spotify and Netflix, resulting in a practice known as ransomware-as-a-service (RaaS). No longer do criminals need an undergraduate degree in computer science to launch an attack.

An RaaS kit may even include 24-hour support, bundled offers, user reviews and forum discussions, not dissimilar to any other e-commerce product. According to US-based cybersecurity firm CrowdStrike, the RaaS market is highly competitive, with operators running marketing campaigns, being active on Twitter and frequently releasing videos and whitepapers.

They have identified several types of RaaS revenue models. Customers can opt for a monthly subscription for a flat fee, a one-time licence fee — sharing the profits from the spoils of extortion — or a combination of these methods.

“It is really easy to get into [the ransomware business], to the extent that they are open-sourcing the code as well,” says David Rajoo, head of systems engineering at Palo Alto Networks Malaysia.

“They are taking older versions or variants of ransomware, tweaking it and releasing it publicly. They are not reinventing the wheel, so to speak, and it is becoming a lot easier for them to do so.”

• **Fraudulent middlemen**

US-based ransomware negotiator Kurtis Minder advises organisations not to search on the internet for help once hit with a ransomware attack. Doing so will likely lead them to another scammer instead.

“Some organisations were scammed by companies claiming to be able to decrypt the files using third-party software. This is a very unlikely capability, as those companies often just negotiate the ransom amount, pay for the decryptors from the ransomware actors and mark up the ransom. Do not fall for this,” Minder tells Digital Edge.

He adds that there have been cases in which outside firms were able to decrypt some of the less sophisticated ransomware. However, such cases are few and far between. If organisations insist on employing outside help to decrypt the files, he recommends proceeding with extreme caution.

LE Global Services Sdn Bhd CEO Fong Choong Fook also warns organisations against paying for online services claiming to be able to decrypt files affected by ransomware. He has yet to identify any such services operating from Malaysia, but many of them can be found online.

“A big shoutout to everyone: please do not ever engage these kinds of snake oil salesmen because there is no such thing as decryption-as-a-service,” he stresses. “This is because, every time the ransomware conducts encryption, the keys are updated and changed. There is no fixed key that is able to decrypt all files.”

## Tips and advice

Protecting oneself against ransomware attacks may seem impossible, considering the mushrooming ransomware variants and tactics used by hackers. There are still several measures, however, that organisations can take to significantly reduce the level of risk involved.

For companies with more resources, LE Global Services Sdn Bhd CEO Fong Choong Fook recommends setting up layers of virtualisation. Virtualisation is the process of creating a simulated computer environment, separated from the physical environment.

An easy way to illustrate this is to imagine running a Windows operating system from within another Windows operating system. Whatever happens within the inner environment, such as a ransomware attack, is less likely to affect the operations of the outer environment. Virtualisation also allows organisations to consolidate hundreds of distinct physical computer servers, treating them as a single (or several) extremely powerful supercomputer.

“The biggest problem with physical servers is that we need to reboot the operating system and install the software one by one, which takes time. Financial institutions have more than 100 servers, all of which could be infected. But we are able to restore hundreds of servers in less than a few days, thanks to virtualisation,” Fong adds.

For organisations that fall victim to ransomware attacks, Fong also recommends visiting the site nomoreransom.org. The No More Ransom project is an initiative by Kaspersky, McAfee, Europol and the Netherlands police, to help victims of ransomware retrieve encrypted data without having to pay criminals.

Users need only to use the Crypto Sheriff tool on the site to identify the ransomware variant affecting the device. The site will then sift through a repository of keys and applications, searching for one that can decrypt the locked data. Unfortunately, there is no universal decryption tool that can address all types of ransomware and, chances are, it is impossible to come up with one.

“How we can understand what the ransomware is doing is through reverse engineering. We obtain a sample, tear it apart and study its behaviour step by step. Through the process, we can understand what type of signal it is sending, and we intercept and study them,” says Fong.

“This is how we are able to find out how the hackers generated the keys and how they had encrypted the data. By breaking down the process, we can come up with solutions for it. That is what the No More Ransom Project is about.”

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-Rajoo-tem1378_theedgemarkets.jpg)

"A good step in the direction we are seeing is companies mandating that the board of directors have someone with actual cyber experience, and not just from a financial or business background.” - Rajoo

David Rajoo, head of systems engineering at Palo Alto Networks Malaysia, also explains that preparation is key in handling a ransomware attack.

Listing the considerations that need to be addressed beforehand, Rajoo says: “Who is your official spokesperson for the incident? Is the company affected, from a regulatory perspective? What sort of data is actually exposed out there? Who are the technical experts that they need to engage?

“There are a lot of moving parts, all the way from senior management to legal to human resources and even, potentially, law enforcement. These table exercises — building muscle memory around when these incidents do eventually happen — are important.

We also need this level of awareness at the board level. A good step in the direction we are seeing is companies mandating that the board of directors have someone with actual cyber experience, and not just from a financial or business background.”

![Cover Story: Holding Data Hostage](../../assets/media/the-edge/cover-story-holding-data-hostage/DE6-CS-Suni-tem1378_theedgemarkets.jpg)

"Companies like us are able to help with policies and processes, but data protection is a must. That is non-negotiable.” - Sunil

For most organisations, Sunil Mahale, general manager of Commvault Southeast Asia, Hong Kong, Taiwan and Korea, recommends a three-step approach of setting up a solid line of defence, coming up with a readiness plan, and securing the network perimeter.

By lines of defence, Mahale means companies need to have several copies of the enterprise data air-gapped and stored in a location isolated from the company’s main network. A readiness plan involves pre-determining the standard operating procedures before organisations are hit with an attack.

Finally, the organisations can employ network security solutions to provide an additional layer of security to inhibit hackers from accessing the network in the first place.

“Small and medium enterprises need a lot more help and to be a lot more adjusted during this time more than ever before, because they may not have all the resources or tools in place to help them,” he adds.

“But the No 1 thing they have to do is to protect and manage their data. If they do not even have a copy of the data anywhere else, how can they recover? Companies like us are able to help with policies and processes, but data protection is a must. That is non-negotiable.”
