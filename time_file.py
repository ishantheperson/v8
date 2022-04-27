#!/usr/bin/env python3
import os
import sys
import platform
import subprocess

from dataclasses import dataclass
from typing import List

def get_v8_architecture() -> str:
  """Gets the architecture in the same format as V8."""
  
  # Requires Python 3.10
  # match platform.machine():
  #   case "x86_64": return "x64"
  #   case "arm64": return "arm64"
  #   case _: raise ValueError("Unknown machine type")

  machine = platform.machine()
  if machine == "x86_64": return "x64"
  elif machine == "arm64": return "arm64"
  else: raise ValueError(f"Unknown machine type '{machine}'. Only x86_64 and arm64 are recognized.")

def get_v8_platform() -> str:
  """Gets the OS name in the same format that v8 uses"""

  osname = platform.system()
  if osname == "Linux": return "linux"
  elif osname == "Darwin": return "mac"
  else: raise ValueError(f"Unsupported OS '{osname}'. Only Linux and Darwin are recognized.")

def get_v8_reference_dir() -> str:
  """Finds the path to the V8 reference build."""
  import shutil

  # The reference executable should be on the $PATH
  path = shutil.which("d8")
  if path is None:
    raise ValueError("d8 not found on $PATH. Try installing v8 using the system package manager.")

  return os.path.dirname(path)

def get_tick_processor_args() -> List[str]:
  """Gets any extra arguments the tick processor needs"""
  osname = get_v8_platform()
  if osname == "linux":
    return []
  elif osname == "mac":
    binutils_dir = subprocess.check_output(["brew", "--prefix", "binutils"]).decode().strip()
    nm_path = f"{binutils_dir}/bin/nm"
    verify_path_exists(nm_path, "GNU binutils version of nm (brew install binutils)")
    return [f"--nm={nm_path}"]
  else: 
    raise ValueError(f"Unsupported OS '{osname}'")

def process_ticklog(log: str) -> int:
  """Processes a tick log and returns the JS tick count"""
  lines = list(map(lambda s: s.strip(), log.splitlines()))
  
  summary_section_start = lines.index("[Summary]:")
  # skip the colummn 
  summary_section = map(lambda line: line.split(), lines[summary_section_start + 2: summary_section_start + 6])
  ticks, _, _, _ = next(filter(lambda line: line[3] == "JavaScript", summary_section))
  return int(ticks)

def verify_path_exists(path: str, reason: str):
  """Verifies that the given path exists."""
  if not os.path.exists(path):
    raise ValueError(f"Can't find {path} ({reason})")

OUR_V8_PATH = f"{os.getcwd()}/out/{get_v8_architecture()}.release"
OUR_D8_PATH = f"{OUR_V8_PATH}/d8"
REFERENCE_V8_PATH = get_v8_reference_dir()

TICK_PROCESSOR = f"{os.getcwd()}/tools/{get_v8_platform()}-tick-processor"
TICK_ARGS = get_tick_processor_args()

verify_path_exists(OUR_D8_PATH, "our V8 release build executable")
verify_path_exists(TICK_PROCESSOR, "tick processor script for the current platform")

if len(sys.argv) < 2:
  raise ValueError(f"Usage: {sys.argv[0]} <script.js> [..script args]")

SCRIPT, ARGS = sys.argv[1], sys.argv[2:]

@dataclass
class ProfilingInstance:
  name: str
  v8_path: str
  extra_d8_args: List[str] # Extra args for d8 when running the script

  def d8_path(self) -> str: 
    """Gets path to d8 executable"""
    return f"{self.v8_path}/d8"

  def run_program(self):
    """Runs d8 on the script, generate profiling data in v8.log"""
    print(f"Running script with {self.name} v8")
    if os.path.exists("./v8.log"):
      os.remove("./v8.log")

    d8_command = [self.d8_path(), "--prof"]
    d8_command += self.extra_d8_args
    d8_command += [SCRIPT, "--"]
    d8_command += ARGS

    subprocess.run(d8_command, check=True, capture_output=True)

  def parse_tick_log(self) -> int:
    """Parses the tick log and returns the JS tick count"""
    print(f"Parsing log for {self.name} v8")
    verify_path_exists("./v8.log", f"V8 log file from {self.name}")

    data = subprocess.run(
      [TICK_PROCESSOR] + TICK_ARGS, 
      env={"D8_PATH": self.v8_path}, 
      check=True, 
      capture_output=True)

    return process_ticklog(data.stdout.decode())

  def run(self):
    self.run_program()
    ticks = self.parse_tick_log()
    print(f"{self.name}: {ticks} ticks")

def profile(name: str, v8_path: str, extra_d8_args: List[str]):
  instance = ProfilingInstance(name, v8_path, extra_d8_args)
  instance.run()

profile(name="reference", v8_path=REFERENCE_V8_PATH, extra_d8_args=[])
profile(name="no inlining", v8_path=REFERENCE_V8_PATH, extra_d8_args=["--no-turbo-inlining"])
profile(name="development", v8_path=OUR_V8_PATH, extra_d8_args=["--turbo-inlining"])
