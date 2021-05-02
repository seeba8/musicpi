import subprocess
p1 = subprocess.Popen(["grep", "m_list", "/var/log/omxlog"], stdout=subprocess.PIPE)
p2 = subprocess.Popen(["tail", "-1"], stdin=p1.stdout, stdout=subprocess.PIPE)
p1.stdout.close()  # Allow p1 to receive a SIGPIPE if p2 exits.
output = p2.communicate()[0]
print(output)